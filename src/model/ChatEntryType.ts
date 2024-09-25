export enum ChatEntryType {
  TextMessage = 'TextMessage',
  Question = 'Question',
  Answer = 'Answer',
  ActionMenuSelection = 'ActionMenuSelection',
  VPRequest = 'VPRequest',
  VPResponse = 'VPResponse',
  VCOffer = 'VCOffer',
  Invitation = 'Invitation',
  Image = 'Image',
  Video = 'Video',
  VoiceNote = 'VoiceNote',
  Link = 'Link',
  ReportMessage = 'ReportMessage',
  System = 'System',
  CallOffer = 'CallOffer',
}

export const isMediaType = (type: ChatEntryType | string) =>
  type === ChatEntryType.Image || type === ChatEntryType.Video || type === ChatEntryType.VoiceNote
