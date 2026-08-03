import { AdCreativeResult, CampaignRequest } from '@types/ad-types';

/**
 * Quality Auditor Module: Performs brand compliance checks, forbidden keyword filters, and style audits
 */
export class QualityAuditorModule {
  public async auditCreative(
    campaign: CampaignRequest,
    creative: Omit<AdCreativeResult, 'auditStatus' | 'auditNotes'>
  ): Promise<{ status: AdCreativeResult['auditStatus']; notes: string[] }> {
    const notes: string[] = [];
    const fullText = `${creative.copywriting.headline} ${creative.copywriting.subHeadline} ${creative.copywriting.bodyText}`.toLowerCase();

    // 1. Forbidden words check
    if (campaign.forbiddenWords && campaign.forbiddenWords.length > 0) {
      for (const word of campaign.forbiddenWords) {
        if (fullText.includes(word.toLowerCase())) {
          notes.push(`[위반] 금칙어 포함 감지: "${word}"`);
        }
      }
    }

    // 2. Headline length check (for social display ads)
    if (creative.copywriting.headline.length > 50) {
      notes.push('[주의] 헤드라인이 50자를 초과하여 일부 모바일 화면에서 잘릴 수 있습니다.');
    }

    // 3. Status determination
    const status: AdCreativeResult['auditStatus'] =
      notes.some((n) => n.startsWith('[위반]'))
        ? 'FLAGGED'
        : notes.some((n) => n.startsWith('[주의]'))
        ? 'NEEDS_REVIEW'
        : 'PASSED';

    if (status === 'PASSED') {
      notes.push('[적합] 브랜드 가이드라인 및 광고 규격 검사 합격');
    }

    return { status, notes };
  }
}
