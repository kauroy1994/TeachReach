/* Draw an optional coordinate plot beneath the numerical lab results.
   plot = {title, xLabel, yLabel, xRange, yRange, xTicks, yTicks,
           equalScale?: boolean, series: [{label, kind: "points"|"line", points: [{x,y,label?}]}
           or {label, kind: "segments", segments: [[{x,y},{x,y}]]}]} */
(() => {
  const ns = "http://www.w3.org/2000/svg";
  const colors = ["#535e69", "#9e1b32", "#006d77", "#6e4485"];
  function svgNode(parent, tag, attrs, text) {
    const node = document.createElementNS(ns, tag);
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
    if (text !== undefined) node.textContent = text;
    parent.append(node);
    return node;
  }
  window.renderMLPlot = function renderMLPlot(parent, result) {
    const plot = result.plot;
    if (!plot) return;
    const figure = document.createElement("figure");
    figure.style.cssText = "background:#fff;border:1px solid #dccdd1;border-radius:12px;margin:1rem 0;padding:.65rem;max-width:44rem";
    const svg = svgNode(figure, "svg", {viewBox:"0 0 480 308", role:"img",
      "aria-label":plot.title + ". Horizontal axis: " + plot.xLabel + ". Vertical axis: " + plot.yLabel + "."});
    svg.style.cssText = "display:block;width:100%;height:auto;color:#26313a;font:14px system-ui,sans-serif";
    svgNode(svg, "title", {}, plot.title);
    const [xmin,xmax] = plot.xRange, [ymin,ymax] = plot.yRange;
    let left = 62, right = 455, top = 25, bottom = 256;
    if (plot.equalScale) {
      const unit = Math.min((right-left)/(xmax-xmin), (bottom-top)/(ymax-ymin));
      const xPad = (right-left - unit*(xmax-xmin))/2;
      const yPad = (bottom-top - unit*(ymax-ymin))/2;
      left += xPad; right -= xPad;
      top += yPad; bottom -= yPad;
    }
    const x = value => left + (value-xmin)*(right-left)/(xmax-xmin);
    const y = value => bottom - (value-ymin)*(bottom-top)/(ymax-ymin);
    for (const tick of plot.yTicks) {
      svgNode(svg, "line", {x1:left, y1:y(tick), x2:right, y2:y(tick), stroke:"#e7e0e2"});
      svgNode(svg, "text", {x:left-9,y:y(tick)+4,"text-anchor":"end",fill:"#424a52"}, tick);
    }
    for (const tick of plot.xTicks) {
      svgNode(svg, "line", {x1:x(tick), y1:bottom, x2:x(tick), y2:bottom+4, stroke:"#71767a"});
      svgNode(svg, "text", {x:x(tick),y:bottom+22,"text-anchor":"middle",fill:"#424a52"}, tick);
    }
    svgNode(svg, "path", {d:"M"+left+" "+top+"V"+bottom+"H"+right,fill:"none",stroke:"#525961","stroke-width":1.6});
    svgNode(svg, "text", {x:(left+right)/2,y:302,"text-anchor":"middle",fill:"#26313a"}, plot.xLabel);
    const center=(top+bottom)/2;
    svgNode(svg, "text", {x:16,y:center,transform:"rotate(-90 16 "+center+")","text-anchor":"middle",fill:"#26313a"}, plot.yLabel);
    const caption = document.createElement("figcaption");
    caption.style.cssText="display:flex;align-items:center;flex-wrap:wrap;gap:.65rem;margin-top:.25rem;font:600 .87rem/1.4 system-ui,sans-serif";
    const heading = document.createElement("strong"); heading.textContent=plot.title; caption.append(heading);
    plot.series.forEach((series, i) => {
      const color=series.color || colors[i%colors.length];
      const isLine=series.kind === "line" || series.kind === "segments";
      if (isLine) {
        const paths = series.kind === "segments" ? series.segments : [series.points];
        for (const path of paths) {
          svgNode(svg, "polyline", {points:path.map(p=>x(p.x)+","+y(p.y)).join(" "),fill:"none",
            stroke:color,"stroke-width":2.6,"stroke-dasharray":series.dashed?"7 5":"none"});
        }
      } else {
        for (const p of series.points) {
          const dot=svgNode(svg,"circle",{cx:x(p.x),cy:y(p.y),r:5.5,stroke:"white","stroke-width":1.6,fill:color});
          svgNode(dot, "title", {}, (p.label || series.label) + ": (" + p.x + ", " + p.y + ")");
        }
      }
      const label=document.createElement("span"), sample=document.createElement("span");
      sample.setAttribute("aria-hidden","true");
      sample.style.cssText=isLine?"display:inline-block;width:1.5rem;vertical-align:middle;border-top:3px "+(series.dashed?"dashed ":"solid ")+color:"display:inline-block;width:.65rem;height:.65rem;vertical-align:middle;border-radius:50%;background:"+color;
      label.append(sample,document.createTextNode(" "+series.label)); caption.append(label);
    });
    figure.append(caption); parent.append(figure);
  };
})();
