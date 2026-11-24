window.ML_LABS = [
  {
    title: "Move the k-means centers",
    prompt: "Each slider places one center at (t,t) hours on the reading/practice plane. Predict Ava’s cluster before moving a center. Bars show squared distance to the assigned center for each weekly log.",
    controls: [
      {label:"Center A coordinate t (hours)", min:0, max:7, step:0.5, value:1},
      {label:"Center B coordinate t (hours)", min:0, max:7, step:0.5, value:5}
    ],
    run([a,b]) {
      const rows = [[1,2],[2,1],[5,6],[6,5]];
      const names = ["Ava","Bo","Cy","Di"];
      const centers = [[a,a],[b,b]];
      const squared = ([x,y],[u,v]) => (x-u)**2 + (y-v)**2;
      const group = rows.map(row => squared(row,centers[0]) <= squared(row,centers[1]) ? 0 : 1);
      const costs = rows.map((row,i) => squared(row,centers[group[i]]));
      const sum = values => values.reduce((total,v) => total+v,0);
      const details = [];
      const moved = centers.map((center,k) => {
        const members = rows.filter((row,i) => group[i] === k);
        const letter = k ? "B" : "A";
        if (!members.length) {
          details.push(letter+" is empty and stays at its previous position.");
          return center;
        }
        const mean = [0,1].map(j => sum(members.map(row => row[j]))/members.length);
        details.push(letter+" moves to ("+mean.map(x => x.toFixed(2)).join(", ")+").");
        return mean;
      });
      const newCost = sum(rows.map((row,i) => squared(row,moved[group[i]])));
      return {
        plot:{title:"Assignment to the nearest center",xLabel:"Reading hours",yLabel:"Practice hours",
          equalScale:true,xRange:[-0.25,7.25],yRange:[-0.25,7.25],xTicks:[0,2,4,6],yTicks:[0,2,4,6],
          series:[
            {label:"Member to center",kind:"segments",dashed:true,segments:rows.map(([x,y],i) => {
              const [cx,cy]=centers[group[i]]; return [{x,y},{x:cx,y:cy}];})},
            {label:"Cluster A members",kind:"points",color:"#9e1b32",points:rows.flatMap(([x,y],i) => group[i]===0 ? [{x,y,label:names[i]}] : [])},
            {label:"Cluster B members",kind:"points",color:"#006d77",points:rows.flatMap(([x,y],i) => group[i]===1 ? [{x,y,label:names[i]}] : [])},
            {label:"Current centers",kind:"points",color:"#303239",points:centers.map(([x,y],i) => ({x,y,label:i?"Center B":"Center A"}))}
          ]},
        labels:names.map((name,i) => name+" → "+(group[i] ? "B" : "A")),
        values:costs,
        explanation:"Ties go to A. Current total cost: "+sum(costs).toFixed(2)+" hours squared. "+details.join(" ")+" With assignments fixed, the updated cost is "+newCost.toFixed(2)+" hours squared."
      };
    }
  },
  {
    title:"Rotate a PCA projection",
    prompt:"The line goes through the mean weekly log (3.5,3.5). Rotate it from the reading axis toward the practice axis. Which angle keeps the largest share of the original variation?",
    controls:[{label:"Angle from the reading axis (degrees)", min:-90,max:90,step:5,value:0}],
    run([angle]) {
      const theta = angle*Math.PI/180;
      const u = [Math.cos(theta),Math.sin(theta)];
      const z = [[-2.5,-1.5],[-1.5,-2.5],[1.5,2.5],[2.5,1.5]];
      const projections = z.map(([x,y]) => x*u[0]+y*u[1]);
      const retained = projections.reduce((total,x) => total+x*x,0)/z.length;
      const mean=3.5, point=([x,y]) => ({x:x+mean,y:y+mean});
      const observed=z.map(point);
      const feet=projections.map(p => point([p*u[0], p*u[1]]));
      const reach=3.5/Math.max(Math.abs(u[0]),Math.abs(u[1]));
      return {
        plot:{title:"Drop each weekly record onto the chosen direction",xLabel:"Reading hours",yLabel:"Practice hours",
          equalScale:true,xRange:[-0.25,7.25],yRange:[-0.25,7.25],xTicks:[0,2,4,6],yTicks:[0,2,4,6],
          series:[
            {label:"Perpendicular distance",kind:"segments",dashed:true,segments:observed.map((p,i) => [p,feet[i]])},
            {label:"Chosen line",kind:"line",points:[-reach,reach].map(p => point([p*u[0],p*u[1]]))},
            {label:"Observed logs",kind:"points",points:observed},
            {label:"Projected logs",kind:"points",points:feet}
          ]},
        labels:["Along the line (h²)","Across the line (h²)"],
        values:[retained,8.5-retained],
        explanation:"Ava projects to "+projections[0].toFixed(2)+" hours along this line. The retained variance is "+retained.toFixed(2)+" of 8.50 hours squared ("+(100*retained/8.5).toFixed(1)+"%). Compare +45° with −45°."
      };
    }
  }
];
