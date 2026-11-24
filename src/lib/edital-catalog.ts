import {getSubjects} from "@/lib/planner-api";
import {catalogFromSubjects} from "@/lib/tribunal-subject-source";
import type {Catalog} from "@/lib/edital-caixa-bb-data";
export async function getEditalCatalog():Promise<Catalog>{return catalogFromSubjects(await getSubjects());}
