import { tribunalCatalog } from "@/lib/tribunal-catalog";
import type { Catalog } from "@/lib/edital-caixa-bb-data";
/** Fonte única e versionada; não mistura dados dos catálogos bancários antigos. */
export async function getEditalCatalog():Promise<Catalog>{return tribunalCatalog;}
