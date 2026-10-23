// Tipos de la entrada @grana/blocks/marketing (dueño: bruno; _comun.md §6, #443, #815): la familia `marketing` del
// generador común scripts/section-types.mjs. Se conserva con sus nombres para src/types.test.js.
import { ROOT, buildFamilyTypes, checkTs, exportedNames, generateFamilyTypes, handTypes as familyHand, readSectionMetas as familyMetas, sectionDeclaration } from './section-types.mjs'

export { ROOT, checkTs, exportedNames, sectionDeclaration }
export const handTypes = (root = ROOT) => familyHand(root, 'marketing')
export const readSectionMetas = (root = ROOT) => familyMetas(root, 'marketing')
export const generateMarketingTypes = ({ root = ROOT } = {}) => generateFamilyTypes({ root, family: 'marketing' })
export const buildMarketingTypes = ({ root = ROOT, outDir } = {}) => buildFamilyTypes({ root, outDir, family: 'marketing' })
