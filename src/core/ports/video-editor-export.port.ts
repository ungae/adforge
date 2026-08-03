import { CapCutProjectExport, TimelineSpecification } from '@types/intelligence-types';

/**
 * Vendor-Agnostic Port for Video Editor Project Export
 * Implementations can export CapCut Draft folders, Premiere Pro XML, DaVinci Resolve EDL, etc.
 */
export interface VideoEditorExportPort {
  exportProject(params: {
    campaignId: string;
    projectTitle: string;
    timeline: TimelineSpecification;
    outputDir?: string;
  }): Promise<CapCutProjectExport>;
}
