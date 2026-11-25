import sources from "./generated/sources.json";
import postings from "./generated/search.json";
import { createTutor } from "./service.mjs";
export { TutorBudget } from "./budget.mjs";

export default { fetch: createTutor(sources, postings) };
