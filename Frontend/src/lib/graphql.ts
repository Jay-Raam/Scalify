import { gql } from '@apollo/client'

export const SEND_MESSAGE = gql`
  mutation SendMessage(
    $businessId: ID!
    $sessionId: ID
    $message: String!
    $attachments: [AttachmentInput!]
  ) {
    sendMessage(
      businessId: $businessId
      sessionId: $sessionId
      message: $message
      attachments: $attachments
    ) {
      message
      detectedLanguage
      sessionId
    }
  }
`
