import type { Paper, SearchQuery, SubQuery, PipelineStats } from "./types"

export const exampleQueries = [
  "CRISPR gene therapy for sickle cell disease",
  "mRNA vaccine efficacy against COVID-19 variants",
  "GLP-1 receptor agonists weight loss outcomes",
  "CAR-T cell therapy solid tumors",
  "Gut microbiome and depression",
  "AI-assisted drug discovery clinical trials",
]

export const mockPapers: Paper[] = [
  {
    id: "1",
    pmid: "38291047",
    title: "CRISPR-Cas9 Gene Editing for Sickle Cell Disease: A Systematic Review and Meta-Analysis of Clinical Outcomes",
    authors: ["Chen W", "Rodriguez A", "Patel S", "Thompson KL", "Nakamura Y"],
    journal: "Nature Medicine",
    year: 2025,
    doi: "10.1038/s41591-025-0142-7",
    abstract: "Background: Sickle cell disease (SCD) affects millions worldwide, with CRISPR-Cas9 gene editing emerging as a potentially curative therapy. We conducted a systematic review and meta-analysis to evaluate the clinical efficacy and safety of CRISPR-based gene therapy for SCD.\n\nMethods: We searched PubMed, Embase, and Cochrane databases from inception through December 2024. We included clinical trials reporting outcomes of CRISPR gene editing in patients with SCD. Primary outcomes were transfusion independence and vaso-occlusive crisis (VOC) frequency.\n\nResults: Eight clinical trials involving 342 patients met inclusion criteria. The pooled rate of transfusion independence at 12 months was 93.2% (95% CI: 89.1-96.4). Mean annual VOC episodes decreased from 7.2 to 0.3 post-treatment (p<0.001). Fetal hemoglobin levels increased to a mean of 40.2% (95% CI: 37.8-42.6). Grade 3+ adverse events occurred in 18.4% of patients, primarily related to myeloablative conditioning.\n\nConclusion: CRISPR-Cas9 gene editing demonstrates remarkable efficacy for SCD, with high rates of transfusion independence and near-elimination of VOC episodes. Long-term safety monitoring remains essential.",
    publicationType: "meta-analysis",
    citationCount: 187,
  },
  {
    id: "2",
    pmid: "38156823",
    title: "Long-term Outcomes of Exa-cel (Exagamglogene Autotemcel) in Transfusion-Dependent Sickle Cell Disease: 3-Year Follow-up of the CLIMB SCD-121 Trial",
    authors: ["Frangoul H", "Altshuler D", "Cappellini MD", "Chen YS", "Domm J", "Eustace BK"],
    journal: "New England Journal of Medicine",
    year: 2025,
    doi: "10.1056/NEJMoa2503891",
    abstract: "Background: Exa-cel (exagamglogene autotemcel) is a CRISPR-Cas9-edited autologous stem cell therapy designed to increase fetal hemoglobin production in patients with sickle cell disease (SCD). We report 3-year follow-up data from the pivotal CLIMB SCD-121 trial.\n\nMethods: This open-label, single-arm, phase 1-2-3 trial enrolled patients aged 12-35 years with severe SCD. Patients underwent myeloablative conditioning with busulfan followed by infusion of exa-cel. The primary endpoint was freedom from severe VOC events for at least 12 consecutive months.\n\nResults: Of 75 patients treated, 72 (96.0%) achieved the primary endpoint. At 36 months, total hemoglobin was 13.8 g/dL (IQR 12.9-14.6), with fetal hemoglobin comprising 43.2% of total hemoglobin. No patients required red blood cell transfusions after month 3. Engraftment was successful in all patients, with sustained editing levels of 78.3% at 36 months.\n\nConclusion: Exa-cel provides durable clinical benefit in SCD through 3 years of follow-up, with sustained high fetal hemoglobin levels and freedom from vaso-occlusive events.",
    publicationType: "clinical-trial",
    citationCount: 342,
  },
  {
    id: "3",
    pmid: "38089312",
    title: "Base Editing Approaches for Beta-Hemoglobinopathies: A Comprehensive Review of Preclinical and Clinical Evidence",
    authors: ["Liu DR", "Newby GA", "Arbab M", "Shen MW"],
    journal: "Blood",
    year: 2024,
    doi: "10.1182/blood.2024018923",
    abstract: "Gene editing technologies have revolutionized the therapeutic landscape for beta-hemoglobinopathies, including sickle cell disease and beta-thalassemia. While CRISPR-Cas9 nuclease approaches have achieved regulatory approval, base editing offers potential advantages including reduced off-target effects, absence of double-strand breaks, and more precise genetic modifications. This comprehensive review examines the preclinical evidence supporting base editing for beta-hemoglobinopathies, including adenine base editors (ABEs) and cytosine base editors (CBEs) targeting the HBB gene, BCL11A enhancer, and HBG1/HBG2 promoter regions. We discuss ongoing clinical trials, delivery strategies, and the comparative advantages of base editing versus nuclease-based approaches. Current evidence suggests that base editing achieves therapeutic levels of gene correction with favorable safety profiles, positioning it as a next-generation approach for treating hemoglobin disorders.",
    publicationType: "review",
    citationCount: 128,
  },
  {
    id: "4",
    pmid: "37945621",
    title: "Randomized Controlled Trial Comparing CRISPR Gene Therapy vs. Hydroxyurea for Prevention of Vaso-Occlusive Crises in Adolescents with Sickle Cell Disease",
    authors: ["Williams DA", "Esrick EB", "Orkin SH", "Bauer DE", "Brendel C"],
    journal: "The Lancet",
    year: 2025,
    doi: "10.1016/S0140-6736(25)00234-1",
    abstract: "Background: CRISPR gene therapy has shown promise for sickle cell disease (SCD), but no randomized comparison with standard-of-care hydroxyurea has been conducted. We performed the first randomized controlled trial comparing CRISPR gene therapy with optimized hydroxyurea therapy in adolescents with SCD.\n\nMethods: In this open-label, randomized, phase 3 trial conducted at 24 centers across North America and Europe, we enrolled patients aged 12-18 years with SCD and >=2 VOC episodes per year despite hydroxyurea. Patients were randomized 1:1 to receive CRISPR gene therapy (CTX001) or continue optimized hydroxyurea (maximum tolerated dose). The primary endpoint was annualized rate of VOC over 24 months.\n\nResults: 156 patients were randomized (78 per group). The annualized VOC rate was 0.2 (95% CI 0.1-0.4) in the gene therapy group vs. 3.8 (95% CI 3.1-4.6) in the hydroxyurea group (rate ratio 0.053, p<0.0001). Hospital days per year decreased from 28.3 to 1.2 in the gene therapy group vs. 28.3 to 19.4 in the hydroxyurea group.\n\nConclusion: CRISPR gene therapy is superior to optimized hydroxyurea for preventing VOC in adolescents with SCD.",
    publicationType: "rct",
    citationCount: 256,
  },
  {
    id: "5",
    pmid: "37823456",
    title: "Prime Editing for Correction of the Sickle Cell Mutation: Efficient and Precise HBB E6V Reversion in Human Hematopoietic Stem Cells",
    authors: ["Anzalone AV", "Koblan LW", "Newby GA", "Rees HA", "Liu DR"],
    journal: "Cell",
    year: 2024,
    doi: "10.1016/j.cell.2024.09.012",
    abstract: "The sickle cell disease (SCD) mutation (HBB E6V) represents an ideal target for prime editing, which can install precise point mutations without double-strand breaks or donor DNA templates. Here we demonstrate efficient prime editing of the SCD mutation in human CD34+ hematopoietic stem and progenitor cells (HSPCs). Using optimized PE5max prime editors with engineered pegRNAs, we achieved 62% reversion of the E6V mutation in HSPCs from SCD patients. Edited cells maintained multilineage engraftment potential in immunodeficient mice, with sustained correction rates of 48% at 16 weeks post-transplant. Red blood cells derived from edited HSPCs showed normalized hemoglobin tetramer formation and resistance to sickling under hypoxic conditions. Off-target analysis by CIRCLE-seq and GUIDE-seq revealed no significant off-target editing. These results establish prime editing as a viable and potentially superior approach for correcting the root cause of sickle cell disease.",
    publicationType: "cohort-study",
    citationCount: 89,
  },
  {
    id: "6",
    pmid: "37701234",
    title: "Systematic Review of Patient-Reported Outcomes Following Gene Therapy for Sickle Cell Disease: Quality of Life, Pain Burden, and Psychosocial Impact",
    authors: ["Dampier C", "Telen MJ", "Jain S", "Khalil M", "Shah N"],
    journal: "Annals of Internal Medicine",
    year: 2024,
    doi: "10.7326/M24-1892",
    abstract: "Background: While gene therapy trials for sickle cell disease (SCD) report favorable biomarker outcomes, comprehensive evaluation of patient-reported outcomes (PROs) is essential for understanding the real-world impact of these treatments.\n\nPurpose: To systematically review PROs following gene therapy for SCD, including quality of life, pain burden, psychological well-being, and functional capacity.\n\nData Sources: PubMed, Embase, PsycINFO, and CINAHL searched through October 2024.\n\nStudy Selection: Studies reporting validated PROs in SCD patients who received gene therapy (including CRISPR-based, lentiviral vector, and gene addition approaches).\n\nResults: 14 studies (n=289 patients) met inclusion criteria. Pooled analysis showed significant improvements in ASCQ-Me pain episode frequency (SMD -1.84, 95% CI -2.23 to -1.45), emotional impact (SMD 1.42, 95% CI 1.08-1.76), and social functioning (SMD 1.31, 95% CI 0.98-1.64). SF-36 physical component scores improved by a mean of 18.3 points, and 87% of patients reported return to work or school within 6 months.\n\nConclusion: Gene therapy for SCD produces substantial, clinically meaningful improvements in patient-reported quality of life across multiple domains.",
    publicationType: "systematic-review",
    citationCount: 74,
  },
]

export const mockSearchHistory: SearchQuery[] = [
  {
    id: "1",
    query: "CRISPR gene therapy sickle cell disease",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    resultCount: 6,
  },
  {
    id: "2",
    query: "mRNA vaccine efficacy COVID-19 variants 2024",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    resultCount: 12,
  },
  {
    id: "3",
    query: "GLP-1 agonists cardiovascular outcomes",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    resultCount: 8,
  },
  {
    id: "4",
    query: "Gut microbiome depression systematic review",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    resultCount: 15,
  },
]

export const mockSubQueries: SubQuery[] = [
  { id: "1", query: "CRISPR Cas9 sickle cell disease clinical trial", status: "completed", resultCount: 847, duration: 1.2 },
  { id: "2", query: "gene editing HBB beta-globin therapy outcomes", status: "completed", resultCount: 423, duration: 0.8 },
  { id: "3", query: "exagamglogene autotemcel exa-cel SCD results", status: "completed", resultCount: 156, duration: 0.6 },
  { id: "4", query: "base editing prime editing hemoglobinopathy", status: "completed", resultCount: 289, duration: 0.9 },
]

export const mockPipelineStats: PipelineStats = {
  totalPapersScanned: 1715,
  relevantPapersFound: 6,
  aiProcessingTime: 3.5,
  subQueries: mockSubQueries,
}

export const mockAIAnswer = `## CRISPR Gene Therapy for Sickle Cell Disease: Current Evidence

CRISPR-based gene therapy has emerged as a **transformative treatment** for sickle cell disease (SCD), with multiple clinical trials demonstrating remarkable efficacy and a favorable safety profile.

### Key Findings

**Clinical Efficacy:**
- The landmark CLIMB SCD-121 trial of exa-cel (exagamglogene autotemcel) showed that **96% of treated patients** achieved freedom from severe vaso-occlusive crises (VOC) for at least 12 consecutive months [1].
- A meta-analysis of 8 clinical trials (n=342) reported a pooled **transfusion independence rate of 93.2%** at 12 months, with mean annual VOC episodes decreasing from 7.2 to 0.3 [2].
- The first randomized controlled trial comparing CRISPR gene therapy to hydroxyurea demonstrated a **94.7% reduction in annualized VOC rate** (rate ratio 0.053, p<0.0001) [3].

**Durability of Response:**
- Three-year follow-up data from CLIMB SCD-121 showed sustained fetal hemoglobin levels of 43.2% and total hemoglobin of 13.8 g/dL, with no patients requiring transfusions after month 3 [1].
- Editing levels remained stable at 78.3% at 36 months, suggesting durable therapeutic benefit.

**Patient-Reported Outcomes:**
- Systematic review of 14 studies (n=289) demonstrated significant improvements across all quality-of-life domains, with **87% of patients returning to work or school** within 6 months [4].
- Pain episode frequency showed the largest effect size (SMD -1.84), indicating substantial clinical benefit.

### Next-Generation Approaches

Base editing and prime editing are emerging as potentially superior alternatives to CRISPR-Cas9 nuclease approaches, offering **reduced off-target effects** and absence of double-strand breaks. Prime editing has achieved 62% reversion of the SCD mutation in human hematopoietic stem cells [5].

### Safety Considerations

Grade 3+ adverse events occurred in approximately 18.4% of patients, primarily related to myeloablative conditioning rather than the gene editing itself. Long-term monitoring for genotoxicity remains essential.

---

*Based on analysis of 6 primary sources from PubMed, spanning 2024-2025.*`
