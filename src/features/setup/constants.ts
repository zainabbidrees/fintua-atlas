/** What the agent can read. Anything else is rejected with a plain message. */
export const ACCEPTED_FILE_TYPES = [
  ".pdf",
  ".txt",
  ".xsd",
  ".xml",
  ".csv",
  ".xls",
  ".xlsx",
];

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
