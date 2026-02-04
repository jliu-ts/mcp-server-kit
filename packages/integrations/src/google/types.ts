/**
 * Google Workspace Types
 *
 * Types for Gmail, Calendar, and Drive APIs
 */

// ============================================================================
// Gmail Types
// ============================================================================

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  historyId: string
  internalDate: string
  payload?: {
    partId?: string
    mimeType: string
    filename?: string
    headers: Array<{ name: string; value: string }>
    body?: {
      attachmentId?: string
      size: number
      data?: string
    }
    parts?: GmailMessagePart[]
  }
  sizeEstimate: number
  raw?: string
}

export interface GmailMessagePart {
  partId: string
  mimeType: string
  filename?: string
  headers: Array<{ name: string; value: string }>
  body?: {
    attachmentId?: string
    size: number
    data?: string
  }
  parts?: GmailMessagePart[]
}

export interface GmailThread {
  id: string
  historyId: string
  messages: GmailMessage[]
}

export interface GmailLabel {
  id: string
  name: string
  messageListVisibility?: 'show' | 'hide'
  labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide'
  type: 'system' | 'user'
  messagesTotal?: number
  messagesUnread?: number
  threadsTotal?: number
  threadsUnread?: number
}

// ============================================================================
// Calendar Types
// ============================================================================

export interface CalendarEvent {
  id: string
  status: 'confirmed' | 'tentative' | 'cancelled'
  htmlLink: string
  created: string
  updated: string
  summary: string
  description?: string
  location?: string
  creator: {
    email: string
    displayName?: string
    self?: boolean
  }
  organizer: {
    email: string
    displayName?: string
    self?: boolean
  }
  start: {
    date?: string
    dateTime?: string
    timeZone?: string
  }
  end: {
    date?: string
    dateTime?: string
    timeZone?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted'
    self?: boolean
    optional?: boolean
  }>
  recurringEventId?: string
  recurrence?: string[]
  conferenceData?: {
    conferenceId?: string
    entryPoints?: Array<{
      entryPointType: string
      uri: string
      label?: string
    }>
  }
}

export interface CalendarList {
  id: string
  summary: string
  description?: string
  timeZone?: string
  colorId?: string
  backgroundColor?: string
  foregroundColor?: string
  selected?: boolean
  accessRole: 'freeBusyReader' | 'reader' | 'writer' | 'owner'
  primary?: boolean
}

// ============================================================================
// Drive Types
// ============================================================================

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  description?: string
  starred: boolean
  trashed: boolean
  parents?: string[]
  webViewLink?: string
  webContentLink?: string
  iconLink?: string
  thumbnailLink?: string
  createdTime: string
  modifiedTime: string
  size?: string
  owners?: Array<{
    displayName: string
    emailAddress: string
    photoLink?: string
  }>
  lastModifyingUser?: {
    displayName: string
    emailAddress: string
    photoLink?: string
  }
  shared?: boolean
  capabilities?: {
    canEdit?: boolean
    canComment?: boolean
    canShare?: boolean
    canDelete?: boolean
    canDownload?: boolean
  }
}

export interface DriveFileList {
  files: DriveFile[]
  nextPageToken?: string
}

// ============================================================================
// Sheets Types
// ============================================================================

export interface Spreadsheet {
  spreadsheetId: string
  properties: SpreadsheetProperties
  sheets?: Sheet[]
  namedRanges?: NamedRange[]
  spreadsheetUrl: string
}

export interface SpreadsheetProperties {
  title: string
  locale?: string
  autoRecalc?: 'ON_CHANGE' | 'MINUTE' | 'HOUR'
  timeZone?: string
  defaultFormat?: CellFormat
}

export interface Sheet {
  properties: SheetProperties
  data?: GridData[]
  merges?: GridRange[]
  conditionalFormats?: ConditionalFormatRule[]
  filterViews?: FilterView[]
  protectedRanges?: ProtectedRange[]
  basicFilter?: BasicFilter
  charts?: EmbeddedChart[]
  bandedRanges?: BandedRange[]
  developerMetadata?: DeveloperMetadata[]
  rowGroups?: DimensionGroup[]
  columnGroups?: DimensionGroup[]
  slicers?: Slicer[]
}

export interface SheetProperties {
  sheetId: number
  title: string
  index: number
  sheetType: 'GRID' | 'OBJECT' | 'DATA_SOURCE'
  gridProperties?: GridProperties
  hidden?: boolean
  tabColor?: Color
  tabColorStyle?: ColorStyle
  rightToLeft?: boolean
  dataSourceSheetProperties?: DataSourceSheetProperties
}

export interface GridProperties {
  rowCount: number
  columnCount: number
  frozenRowCount?: number
  frozenColumnCount?: number
  hideGridlines?: boolean
  rowGroupControlAfter?: boolean
  columnGroupControlAfter?: boolean
}

export interface ValueRange {
  range: string
  majorDimension?: 'ROWS' | 'COLUMNS'
  values?: unknown[][]
}

export interface UpdateValuesResponse {
  spreadsheetId: string
  updatedRange: string
  updatedRows: number
  updatedColumns: number
  updatedCells: number
  updatedData?: ValueRange
}

export interface AppendValuesResponse {
  spreadsheetId: string
  tableRange?: string
  updates: UpdateValuesResponse
}

export interface ClearValuesResponse {
  spreadsheetId: string
  clearedRange: string
}

export interface BatchUpdateSpreadsheetRequest {
  requests: SpreadsheetRequest[]
  includeSpreadsheetInResponse?: boolean
  responseRanges?: string[]
  responseIncludeGridData?: boolean
}

export interface BatchUpdateSpreadsheetResponse {
  spreadsheetId: string
  replies: unknown[]
  updatedSpreadsheet?: Spreadsheet
}

export interface SpreadsheetRequest {
  addSheet?: { properties: Partial<SheetProperties> }
  deleteSheet?: { sheetId: number }
  duplicateSheet?: {
    sourceSheetId: number
    insertSheetIndex?: number
    newSheetId?: number
    newSheetName?: string
  }
  copyPaste?: {
    source: GridRange
    destination: GridRange
    pasteType?: string
    pasteOrientation?: string
  }
  updateSheetProperties?: {
    properties: Partial<SheetProperties>
    fields: string
  }
  updateCells?: {
    rows: RowData[]
    fields: string
    start?: GridCoordinate
    range?: GridRange
  }
  insertDimension?: {
    range: DimensionRange
    inheritFromBefore?: boolean
  }
  deleteDimension?: {
    range: DimensionRange
  }
  autoFill?: {
    useAlternateSeries?: boolean
    sourceAndDestination?: {
      source: GridRange
      dimension: 'ROWS' | 'COLUMNS'
      fillLength: number
    }
  }
  findReplace?: {
    find: string
    replacement: string
    matchCase?: boolean
    matchEntireCell?: boolean
    searchByRegex?: boolean
    includeFormulas?: boolean
    range?: GridRange
    sheetId?: number
    allSheets?: boolean
  }
  sortRange?: {
    range: GridRange
    sortSpecs: SortSpec[]
  }
  mergeCells?: {
    range: GridRange
    mergeType?: 'MERGE_ALL' | 'MERGE_COLUMNS' | 'MERGE_ROWS'
  }
  unmergeCells?: {
    range: GridRange
  }
  [key: string]: unknown
}

export interface GridRange {
  sheetId?: number
  startRowIndex?: number
  endRowIndex?: number
  startColumnIndex?: number
  endColumnIndex?: number
}

export interface GridCoordinate {
  sheetId: number
  rowIndex: number
  columnIndex: number
}

export interface DimensionRange {
  sheetId: number
  dimension: 'ROWS' | 'COLUMNS'
  startIndex: number
  endIndex: number
}

export interface RowData {
  values: CellData[]
}

export interface CellData {
  userEnteredValue?: ExtendedValue
  effectiveValue?: ExtendedValue
  formattedValue?: string
  userEnteredFormat?: CellFormat
  effectiveFormat?: CellFormat
  hyperlink?: string
  note?: string
  textFormatRuns?: TextFormatRun[]
  dataValidation?: DataValidationRule
  pivotTable?: PivotTable
  dataSourceTable?: DataSourceTable
  dataSourceFormula?: DataSourceFormula
}

export interface ExtendedValue {
  numberValue?: number
  stringValue?: string
  boolValue?: boolean
  formulaValue?: string
  errorValue?: ErrorValue
}

export interface ErrorValue {
  type: 'ERROR_TYPE_UNSPECIFIED' | 'ERROR' | 'NULL_VALUE' | 'DIVIDE_BY_ZERO' | 'VALUE' | 'REF' | 'NAME' | 'NUM' | 'N_A' | 'LOADING'
  message?: string
}

export interface SortSpec {
  dimensionIndex: number
  sortOrder: 'ASCENDING' | 'DESCENDING'
}

export interface NamedRange {
  namedRangeId: string
  name: string
  range: GridRange
}

// Simplified placeholder types for complex nested structures
export type CellFormat = Record<string, unknown>
export type Color = Record<string, unknown>
export type ColorStyle = Record<string, unknown>
export type DataSourceSheetProperties = Record<string, unknown>
export type GridData = Record<string, unknown>
export type ConditionalFormatRule = Record<string, unknown>
export type FilterView = Record<string, unknown>
export type ProtectedRange = Record<string, unknown>
export type BasicFilter = Record<string, unknown>
export type EmbeddedChart = Record<string, unknown>
export type BandedRange = Record<string, unknown>
export type DeveloperMetadata = Record<string, unknown>
export type DimensionGroup = Record<string, unknown>
export type Slicer = Record<string, unknown>
export type TextFormatRun = Record<string, unknown>
export type DataValidationRule = Record<string, unknown>
export type PivotTable = Record<string, unknown>
export type DataSourceTable = Record<string, unknown>
export type DataSourceFormula = Record<string, unknown>

// ============================================================================
// Tasks Types
// ============================================================================

export interface TaskList {
  kind: 'tasks#taskList'
  id: string
  etag: string
  title: string
  updated: string
  selfLink: string
}

export interface TaskListsResponse {
  kind: 'tasks#taskLists'
  etag: string
  nextPageToken?: string
  items: TaskList[]
}

export interface Task {
  kind: 'tasks#task'
  id: string
  etag: string
  title: string
  updated: string
  selfLink: string
  parent?: string
  position: string
  notes?: string
  status: 'needsAction' | 'completed'
  due?: string
  completed?: string
  deleted?: boolean
  hidden?: boolean
  links?: Array<{
    type: string
    description?: string
    link: string
  }>
}

export interface TasksResponse {
  kind: 'tasks#tasks'
  etag: string
  nextPageToken?: string
  items: Task[]
}

// ============================================================================
// API Params
// ============================================================================

export interface ListMessagesParams {
  maxResults?: number
  pageToken?: string
  q?: string
  labelIds?: string[]
  includeSpamTrash?: boolean
}

export interface GetMessageParams {
  id: string
  format?: 'minimal' | 'full' | 'raw' | 'metadata'
  metadataHeaders?: string[]
}

export interface SendMessageParams {
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
  replyTo?: string
  inReplyTo?: string
  threadId?: string
}

export interface ListEventsParams {
  calendarId?: string
  maxResults?: number
  pageToken?: string
  timeMin?: string
  timeMax?: string
  q?: string
  singleEvents?: boolean
  orderBy?: 'startTime' | 'updated'
}

export interface CreateEventParams {
  calendarId?: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  attendees?: Array<{ email: string }>
  conferenceData?: {
    createRequest?: {
      requestId: string
      conferenceSolutionKey: { type: string }
    }
  }
  sendUpdates?: 'all' | 'externalOnly' | 'none'
}

export interface ListFilesParams {
  maxResults?: number
  pageToken?: string
  q?: string
  orderBy?: string
  fields?: string
  spaces?: 'drive' | 'appDataFolder' | 'photos'
}

export interface GetFileParams {
  fileId: string
  fields?: string
}

// Sheets Params
export interface GetSpreadsheetParams {
  spreadsheetId: string
  ranges?: string[]
  includeGridData?: boolean
}

export interface GetValuesParams {
  spreadsheetId: string
  range: string
  majorDimension?: 'ROWS' | 'COLUMNS'
  valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA'
  dateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING'
}

export interface UpdateValuesParams {
  spreadsheetId: string
  range: string
  values: unknown[][]
  valueInputOption?: 'RAW' | 'USER_ENTERED'
  includeValuesInResponse?: boolean
}

export interface AppendValuesParams {
  spreadsheetId: string
  range: string
  values: unknown[][]
  valueInputOption?: 'RAW' | 'USER_ENTERED'
  insertDataOption?: 'OVERWRITE' | 'INSERT_ROWS'
  includeValuesInResponse?: boolean
}

export interface ClearValuesParams {
  spreadsheetId: string
  range: string
}

export interface CreateSpreadsheetParams {
  title: string
  sheets?: Array<{ properties: Partial<SheetProperties> }>
}

export interface AddSheetParams {
  spreadsheetId: string
  title: string
  rowCount?: number
  columnCount?: number
}

export interface DeleteSheetParams {
  spreadsheetId: string
  sheetId: number
}

export interface CopySheetParams {
  spreadsheetId: string
  sheetId: number
  destinationSpreadsheetId: string
}

// Tasks Params
export interface ListTaskListsParams {
  maxResults?: number
  pageToken?: string
}

export interface CreateTaskListParams {
  title: string
}

export interface UpdateTaskListParams {
  taskListId: string
  title: string
}

export interface ListTasksParams {
  taskListId: string
  maxResults?: number
  pageToken?: string
  showCompleted?: boolean
  showDeleted?: boolean
  showHidden?: boolean
  dueMin?: string
  dueMax?: string
}

export interface CreateTaskParams {
  taskListId: string
  title: string
  notes?: string
  due?: string
  status?: 'needsAction' | 'completed'
  parent?: string
  previous?: string
}

export interface UpdateTaskParams {
  taskListId: string
  taskId: string
  title?: string
  notes?: string
  due?: string
  status?: 'needsAction' | 'completed'
}

export interface MoveTaskParams {
  taskListId: string
  taskId: string
  parent?: string
  previous?: string
}

// ============================================================================
// Docs Types
// ============================================================================

export interface Document {
  documentId: string
  title: string
  body?: DocumentBody
  headers?: Record<string, Header>
  footers?: Record<string, Footer>
  footnotes?: Record<string, Footnote>
  documentStyle?: DocumentStyle
  namedStyles?: NamedStyles
  revisionId?: string
  suggestionsViewMode?: string
}

export interface DocumentBody {
  content: StructuralElement[]
}

export interface StructuralElement {
  startIndex: number
  endIndex: number
  paragraph?: Paragraph
  sectionBreak?: SectionBreak
  table?: Table
  tableOfContents?: TableOfContents
}

export interface Paragraph {
  elements: ParagraphElement[]
  paragraphStyle?: ParagraphStyle
  bullet?: Bullet
}

export interface ParagraphElement {
  startIndex: number
  endIndex: number
  textRun?: TextRun
  inlineObjectElement?: InlineObjectElement
  pageBreak?: Record<string, unknown>
  horizontalRule?: Record<string, unknown>
}

export interface TextRun {
  content: string
  textStyle?: TextStyle
}

export interface TextStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  fontSize?: Dimension
  foregroundColor?: OptionalColor
  backgroundColor?: OptionalColor
  link?: Link
  baselineOffset?: 'NONE' | 'SUPERSCRIPT' | 'SUBSCRIPT'
  smallCaps?: boolean
  weightedFontFamily?: WeightedFontFamily
}

export interface Dimension {
  magnitude: number
  unit: 'UNIT_UNSPECIFIED' | 'PT'
}

export interface OptionalColor {
  color?: { rgbColor?: RgbColor }
}

export interface RgbColor {
  red?: number
  green?: number
  blue?: number
}

export interface Link {
  url?: string
  bookmarkId?: string
  headingId?: string
}

export interface WeightedFontFamily {
  fontFamily: string
  weight: number
}

export interface ParagraphStyle {
  namedStyleType?: string
  alignment?: 'START' | 'CENTER' | 'END' | 'JUSTIFIED'
  lineSpacing?: number
  direction?: 'LEFT_TO_RIGHT' | 'RIGHT_TO_LEFT'
  spacingMode?: 'NEVER_COLLAPSE' | 'COLLAPSE_LISTS'
  spaceAbove?: Dimension
  spaceBelow?: Dimension
  borderBetween?: ParagraphBorder
  borderTop?: ParagraphBorder
  borderBottom?: ParagraphBorder
  borderLeft?: ParagraphBorder
  borderRight?: ParagraphBorder
  indentFirstLine?: Dimension
  indentStart?: Dimension
  indentEnd?: Dimension
  tabStops?: TabStop[]
  keepLinesTogether?: boolean
  keepWithNext?: boolean
  avoidWidowAndOrphan?: boolean
  shading?: Shading
  headingId?: string
}

export interface ParagraphBorder {
  color?: OptionalColor
  width?: Dimension
  padding?: Dimension
  dashStyle?: 'SOLID' | 'DOT' | 'DASH'
}

export interface TabStop {
  offset: Dimension
  alignment: 'START' | 'CENTER' | 'END'
}

export interface Shading {
  backgroundColor?: OptionalColor
}

export interface Bullet {
  listId: string
  nestingLevel?: number
  textStyle?: TextStyle
}

export interface InlineObjectElement {
  inlineObjectId: string
  textStyle?: TextStyle
}

export interface Table {
  rows: number
  columns: number
  tableRows: TableRow[]
  suggestedInsertionIds?: string[]
  suggestedDeletionIds?: string[]
  tableStyle?: TableStyle
}

export interface TableRow {
  startIndex: number
  endIndex: number
  tableCells: TableCell[]
  suggestedInsertionIds?: string[]
  suggestedDeletionIds?: string[]
  tableRowStyle?: TableRowStyle
}

export interface TableCell {
  startIndex: number
  endIndex: number
  content: StructuralElement[]
  tableCellStyle?: TableCellStyle
}

export interface TableStyle {
  tableColumnProperties?: TableColumnProperties[]
}

export interface TableColumnProperties {
  widthType: 'EVENLY_DISTRIBUTED' | 'FIXED_WIDTH'
  width?: Dimension
}

export interface TableRowStyle {
  minRowHeight?: Dimension
}

export interface TableCellStyle {
  rowSpan?: number
  columnSpan?: number
  backgroundColor?: OptionalColor
  borderLeft?: TableCellBorder
  borderRight?: TableCellBorder
  borderTop?: TableCellBorder
  borderBottom?: TableCellBorder
  paddingLeft?: Dimension
  paddingRight?: Dimension
  paddingTop?: Dimension
  paddingBottom?: Dimension
  contentAlignment?: 'TOP' | 'MIDDLE' | 'BOTTOM'
}

export interface TableCellBorder {
  color?: OptionalColor
  width?: Dimension
  dashStyle?: 'SOLID' | 'DOT' | 'DASH'
}

// Placeholder types for complex nested structures
export type SectionBreak = Record<string, unknown>
export type TableOfContents = Record<string, unknown>
export type Header = Record<string, unknown>
export type Footer = Record<string, unknown>
export type Footnote = Record<string, unknown>
export type DocumentStyle = Record<string, unknown>
export type NamedStyles = Record<string, unknown>

// Docs Batch Update Request/Response
export interface BatchUpdateDocumentRequest {
  requests: DocumentRequest[]
  writeControl?: WriteControl
}

export interface WriteControl {
  requiredRevisionId?: string
  targetRevisionId?: string
}

export interface BatchUpdateDocumentResponse {
  documentId: string
  replies: DocumentReply[]
  writeControl?: WriteControl
}

export interface DocumentReply {
  replaceAllText?: ReplaceAllTextResponse
  createNamedRange?: CreateNamedRangeResponse
  insertInlineImage?: InsertInlineImageResponse
  insertInlineSheetsChart?: InsertInlineSheetsChartResponse
}

export interface ReplaceAllTextResponse {
  occurrencesChanged: number
}

export interface CreateNamedRangeResponse {
  namedRangeId: string
}

export interface InsertInlineImageResponse {
  objectId: string
}

export interface InsertInlineSheetsChartResponse {
  objectId: string
}

export interface DocumentRequest {
  insertText?: InsertTextRequest
  deleteContentRange?: DeleteContentRangeRequest
  replaceAllText?: ReplaceAllTextRequest
  insertInlineImage?: InsertInlineImageRequest
  insertTable?: InsertTableRequest
  insertTableRow?: InsertTableRowRequest
  insertTableColumn?: InsertTableColumnRequest
  deleteTableRow?: DeleteTableRowRequest
  deleteTableColumn?: DeleteTableColumnRequest
  updateTextStyle?: UpdateTextStyleRequest
  updateParagraphStyle?: UpdateParagraphStyleRequest
  createNamedRange?: CreateNamedRangeRequest
  deleteNamedRange?: DeleteNamedRangeRequest
  [key: string]: unknown
}

export interface InsertTextRequest {
  location: Location
  text: string
}

export interface Location {
  index: number
  segmentId?: string
}

export interface DeleteContentRangeRequest {
  range: Range
}

export interface Range {
  startIndex: number
  endIndex: number
  segmentId?: string
}

export interface ReplaceAllTextRequest {
  containsText: SubstringMatchCriteria
  replaceText: string
}

export interface SubstringMatchCriteria {
  text: string
  matchCase?: boolean
}

export interface InsertInlineImageRequest {
  location: Location
  uri: string
  objectSize?: Size
}

export interface Size {
  height?: Dimension
  width?: Dimension
}

export interface InsertTableRequest {
  location: Location
  rows: number
  columns: number
}

export interface InsertTableRowRequest {
  tableCellLocation: TableCellLocation
  insertBelow: boolean
}

export interface TableCellLocation {
  tableStartLocation: Location
  rowIndex: number
  columnIndex: number
}

export interface InsertTableColumnRequest {
  tableCellLocation: TableCellLocation
  insertRight: boolean
}

export interface DeleteTableRowRequest {
  tableCellLocation: TableCellLocation
}

export interface DeleteTableColumnRequest {
  tableCellLocation: TableCellLocation
}

export interface UpdateTextStyleRequest {
  range: Range
  textStyle: TextStyle
  fields: string
}

export interface UpdateParagraphStyleRequest {
  range: Range
  paragraphStyle: ParagraphStyle
  fields: string
}

export interface CreateNamedRangeRequest {
  name: string
  range: Range
}

export interface DeleteNamedRangeRequest {
  name?: string
  namedRangeId?: string
}

// Docs API Params
export interface GetDocumentParams {
  documentId: string
  suggestionsViewMode?: 'DEFAULT_FOR_CURRENT_ACCESS' | 'SUGGESTIONS_INLINE' | 'PREVIEW_SUGGESTIONS_ACCEPTED' | 'PREVIEW_WITHOUT_SUGGESTIONS'
}

export interface CreateDocumentParams {
  title: string
}

export interface BatchUpdateDocumentParams {
  documentId: string
  requests: DocumentRequest[]
}

export interface InsertTextParams {
  documentId: string
  text: string
  index: number
  segmentId?: string
}

export interface DeleteContentParams {
  documentId: string
  startIndex: number
  endIndex: number
  segmentId?: string
}

export interface ReplaceTextParams {
  documentId: string
  findText: string
  replaceText: string
  matchCase?: boolean
}

export interface InsertImageParams {
  documentId: string
  imageUri: string
  index: number
  width?: number
  height?: number
}

export interface InsertTableParams {
  documentId: string
  index: number
  rows: number
  columns: number
}

// ============================================================================
// Slides Types
// ============================================================================

export interface Presentation {
  presentationId: string
  pageSize?: PageSize
  slides?: Page[]
  title: string
  masters?: Page[]
  layouts?: Page[]
  locale?: string
  revisionId?: string
  notesMaster?: Page
}

export interface PageSize {
  width: SlideDimension
  height: SlideDimension
}

export interface SlideDimension {
  magnitude: number
  unit: 'UNIT_UNSPECIFIED' | 'EMU' | 'PT'
}

export interface Page {
  objectId: string
  pageType: 'SLIDE' | 'MASTER' | 'LAYOUT' | 'NOTES' | 'NOTES_MASTER'
  pageElements?: PageElement[]
  slideProperties?: SlideProperties
  layoutProperties?: LayoutProperties
  notesProperties?: NotesProperties
  masterProperties?: MasterProperties
  pageProperties?: PageProperties
  revisionId?: string
}

export interface PageElement {
  objectId: string
  size?: SizeElement
  transform?: AffineTransform
  title?: string
  description?: string
  shape?: Shape
  image?: Image
  video?: Video
  line?: Line
  table?: SlideTable
  wordArt?: WordArt
  sheetsChart?: SheetsChart
  sectionBreak?: Record<string, unknown>
  elementGroup?: Group
}

export interface SizeElement {
  width: SlideDimension
  height: SlideDimension
}

export interface AffineTransform {
  scaleX: number
  scaleY: number
  shearX?: number
  shearY?: number
  translateX: number
  translateY: number
  unit: 'UNIT_UNSPECIFIED' | 'EMU' | 'PT'
}

export interface Shape {
  shapeType: string
  text?: TextContent
  shapeProperties?: ShapeProperties
  placeholder?: Placeholder
}

export interface TextContent {
  textElements?: TextElement[]
  lists?: Record<string, List>
}

export interface TextElement {
  startIndex?: number
  endIndex?: number
  paragraphMarker?: ParagraphMarker
  textRun?: SlideTextRun
  autoText?: AutoText
}

export interface SlideTextRun {
  content: string
  style?: SlideTextStyle
}

export interface SlideTextStyle {
  backgroundColor?: OptionalColor
  foregroundColor?: OptionalColor
  bold?: boolean
  italic?: boolean
  fontFamily?: string
  fontSize?: SlideDimension
  link?: SlideLink
  baselineOffset?: 'NONE' | 'SUPERSCRIPT' | 'SUBSCRIPT'
  smallCaps?: boolean
  strikethrough?: boolean
  underline?: boolean
  weightedFontFamily?: SlideWeightedFontFamily
}

export interface SlideLink {
  url?: string
  slideIndex?: number
  pageObjectId?: string
  relativeLink?: 'NEXT_SLIDE' | 'PREVIOUS_SLIDE' | 'FIRST_SLIDE' | 'LAST_SLIDE'
}

export interface SlideWeightedFontFamily {
  fontFamily: string
  weight: number
}

export interface ParagraphMarker {
  style?: ParagraphStyle
  bullet?: SlideBullet
}

export interface SlideBullet {
  listId: string
  nestingLevel?: number
  glyph?: string
  bulletStyle?: SlideTextStyle
}

export interface AutoText {
  type: 'SLIDE_NUMBER'
  content?: string
  style?: SlideTextStyle
}

export interface List {
  listId: string
  nestingLevel?: Record<string, NestingLevel>
}

export interface NestingLevel {
  bulletStyle?: SlideTextStyle
}

export interface ShapeProperties {
  shapeBackgroundFill?: ShapeFill
  outline?: Outline
  shadow?: Shadow
  link?: SlideLink
  contentAlignment?: 'CONTENT_ALIGNMENT_UNSPECIFIED' | 'TOP' | 'MIDDLE' | 'BOTTOM'
  autofit?: Autofit
}

export interface ShapeFill {
  propertyState?: 'RENDERED' | 'NOT_RENDERED' | 'INHERIT'
  solidFill?: SolidFill
}

export interface SolidFill {
  color?: OpaqueColor
  alpha?: number
}

export interface OpaqueColor {
  rgbColor?: RgbColor
  themeColor?: string
}

export interface Outline {
  outlineFill?: OutlineFill
  weight?: SlideDimension
  dashStyle?: string
  propertyState?: 'RENDERED' | 'NOT_RENDERED' | 'INHERIT'
}

export interface OutlineFill {
  solidFill?: SolidFill
}

export interface Shadow {
  type?: string
  transform?: AffineTransform
  alignment?: string
  blurRadius?: SlideDimension
  color?: OpaqueColor
  alpha?: number
  rotateWithShape?: boolean
  propertyState?: 'RENDERED' | 'NOT_RENDERED' | 'INHERIT'
}

export interface Autofit {
  autofitType?: 'NONE' | 'TEXT_AUTOFIT' | 'SHAPE_AUTOFIT'
  fontScale?: number
  lineSpacingReduction?: number
}

export interface Placeholder {
  type: string
  index?: number
  parentObjectId?: string
}

export interface Image {
  contentUrl?: string
  sourceUrl?: string
  imageProperties?: ImageProperties
  placeholder?: Placeholder
}

export interface ImageProperties {
  cropProperties?: CropProperties
  transparency?: number
  brightness?: number
  contrast?: number
  recolor?: Recolor
  outline?: Outline
  shadow?: Shadow
  link?: SlideLink
}

export interface CropProperties {
  leftOffset?: number
  rightOffset?: number
  topOffset?: number
  bottomOffset?: number
  angle?: number
}

export interface Recolor {
  recolorStops?: ColorStop[]
  name?: string
}

export interface ColorStop {
  color?: OpaqueColor
  alpha?: number
  position?: number
}

export interface Video {
  url?: string
  source?: 'YOUTUBE' | 'DRIVE' | 'SOURCE_UNSPECIFIED'
  id?: string
  videoProperties?: VideoProperties
}

export interface VideoProperties {
  outline?: Outline
  autoPlay?: boolean
  start?: number
  end?: number
  mute?: boolean
}

export interface Line {
  lineProperties?: LineProperties
  lineType?: string
  lineCategory?: 'STRAIGHT' | 'BENT' | 'CURVED'
}

export interface LineProperties {
  lineFill?: LineFill
  weight?: SlideDimension
  dashStyle?: string
  startArrow?: string
  endArrow?: string
  link?: SlideLink
  startConnection?: LineConnection
  endConnection?: LineConnection
}

export interface LineFill {
  solidFill?: SolidFill
}

export interface LineConnection {
  connectedObjectId?: string
  connectionSiteIndex?: number
}

export interface SlideTable {
  rows: number
  columns: number
  tableRows?: TableRowSlide[]
  tableColumns?: TableColumnProperties[]
  horizontalBorderRows?: TableBorderRow[]
  verticalBorderRows?: TableBorderRow[]
}

export interface TableRowSlide {
  rowHeight?: SlideDimension
  tableCells?: TableCellSlide[]
  tableRowProperties?: TableRowPropertiesSlide
}

export interface TableCellSlide {
  location?: TableCellLocationSlide
  rowSpan?: number
  columnSpan?: number
  text?: TextContent
  tableCellProperties?: TableCellPropertiesSlide
}

export interface TableCellLocationSlide {
  rowIndex: number
  columnIndex: number
}

export interface TableCellPropertiesSlide {
  tableCellBackgroundFill?: TableCellBackgroundFill
  contentAlignment?: 'CONTENT_ALIGNMENT_UNSPECIFIED' | 'TOP' | 'MIDDLE' | 'BOTTOM'
}

export interface TableCellBackgroundFill {
  propertyState?: 'RENDERED' | 'NOT_RENDERED' | 'INHERIT'
  solidFill?: SolidFill
}

export interface TableRowPropertiesSlide {
  minRowHeight?: SlideDimension
}

export interface TableBorderRow {
  tableBorderCells?: TableBorderCell[]
}

export interface TableBorderCell {
  location?: TableCellLocationSlide
  tableBorderProperties?: TableBorderProperties
}

export interface TableBorderProperties {
  tableBorderFill?: TableBorderFill
  weight?: SlideDimension
  dashStyle?: string
}

export interface TableBorderFill {
  solidFill?: SolidFill
}

export interface WordArt {
  renderedText?: string
}

export interface SheetsChart {
  spreadsheetId?: string
  chartId?: number
  contentUrl?: string
  sheetsChartProperties?: SheetsChartProperties
}

export interface SheetsChartProperties {
  chartImageProperties?: ImageProperties
}

export interface Group {
  children?: PageElement[]
}

export interface SlideProperties {
  layoutObjectId?: string
  masterObjectId?: string
  notesPage?: Page
  isSkipped?: boolean
}

export interface LayoutProperties {
  masterObjectId?: string
  name?: string
  displayName?: string
}

export interface NotesProperties {
  speakerNotesObjectId?: string
}

export interface MasterProperties {
  displayName?: string
}

export interface PageProperties {
  pageBackgroundFill?: PageBackgroundFill
  colorScheme?: ColorScheme
}

export interface PageBackgroundFill {
  propertyState?: 'RENDERED' | 'NOT_RENDERED' | 'INHERIT'
  solidFill?: SolidFill
  stretchedPictureFill?: StretchedPictureFill
}

export interface StretchedPictureFill {
  contentUrl?: string
  size?: SizeElement
}

export interface ColorScheme {
  colors?: ThemeColorPair[]
}

export interface ThemeColorPair {
  type: string
  color?: RgbColor
}

// Slides Batch Update Request/Response
export interface BatchUpdatePresentationRequest {
  requests: PresentationRequest[]
  writeControl?: WriteControl
}

export interface BatchUpdatePresentationResponse {
  presentationId: string
  replies: PresentationReply[]
  writeControl?: WriteControl
}

export interface PresentationReply {
  createSlide?: CreateSlideResponse
  createShape?: CreateShapeResponse
  createSheetsChart?: CreateSheetsChartResponse
  createImage?: CreateImageResponse
  createVideo?: CreateVideoResponse
  createLine?: CreateLineResponse
  createTable?: CreateTableResponse
  replaceAllText?: ReplaceAllTextResponse
  duplicateObject?: DuplicateObjectResponse
  updatePageElementTransform?: Record<string, unknown>
  groupObjects?: GroupObjectsResponse
  [key: string]: unknown
}

export interface CreateSlideResponse {
  objectId: string
}

export interface CreateShapeResponse {
  objectId: string
}

export interface CreateSheetsChartResponse {
  objectId: string
}

export interface CreateImageResponse {
  objectId: string
}

export interface CreateVideoResponse {
  objectId: string
}

export interface CreateLineResponse {
  objectId: string
}

export interface CreateTableResponse {
  objectId: string
}

export interface DuplicateObjectResponse {
  objectId: string
}

export interface GroupObjectsResponse {
  objectId: string
}

export interface PresentationRequest {
  createSlide?: CreateSlideRequest
  duplicateObject?: DuplicateObjectRequest
  deleteObject?: DeleteObjectRequest
  updatePageElementTransform?: UpdatePageElementTransformRequest
  insertText?: InsertSlidesTextRequest
  deleteText?: DeleteTextRequest
  replaceAllText?: ReplaceAllSlidesTextRequest
  createShape?: CreateShapeRequest
  createImage?: CreateImageRequest
  createTable?: CreateSlidesTableRequest
  insertTableRows?: InsertTableRowsRequest
  insertTableColumns?: InsertTableColumnsRequest
  deleteTableRow?: DeleteTableRowSlidesRequest
  deleteTableColumn?: DeleteTableColumnSlidesRequest
  [key: string]: unknown
}

export interface CreateSlideRequest {
  objectId?: string
  insertionIndex?: number
  slideLayoutReference?: SlideLayoutReference
  placeholderIdMappings?: PlaceholderIdMapping[]
}

export interface SlideLayoutReference {
  predefinedLayout?: 'BLANK' | 'CAPTION_ONLY' | 'TITLE' | 'TITLE_AND_BODY' | 'TITLE_AND_TWO_COLUMNS' | 'TITLE_ONLY' | 'SECTION_HEADER' | 'SECTION_TITLE_AND_DESCRIPTION' | 'ONE_COLUMN_TEXT' | 'MAIN_POINT' | 'BIG_NUMBER'
  layoutId?: string
}

export interface PlaceholderIdMapping {
  layoutPlaceholder?: Placeholder
  objectId?: string
  layoutPlaceholderObjectId?: string
}

export interface DuplicateObjectRequest {
  objectId: string
  objectIds?: Record<string, string>
}

export interface DeleteObjectRequest {
  objectId: string
}

export interface UpdatePageElementTransformRequest {
  objectId: string
  transform: AffineTransform
  applyMode: 'ABSOLUTE' | 'RELATIVE'
}

export interface InsertSlidesTextRequest {
  objectId: string
  insertionIndex?: number
  text: string
  cellLocation?: TableCellLocationSlide
}

export interface DeleteTextRequest {
  objectId: string
  textRange: SlideRange
  cellLocation?: TableCellLocationSlide
}

export interface SlideRange {
  startIndex?: number
  endIndex?: number
  type?: 'FIXED_RANGE' | 'FROM_START_INDEX' | 'ALL'
}

export interface ReplaceAllSlidesTextRequest {
  containsText: SubstringMatchCriteria
  replaceText: string
  pageObjectIds?: string[]
}

export interface CreateShapeRequest {
  objectId?: string
  shapeType: string
  elementProperties: PageElementProperties
}

export interface PageElementProperties {
  pageObjectId: string
  size?: SizeElement
  transform?: AffineTransform
}

export interface CreateImageRequest {
  objectId?: string
  url?: string
  elementProperties: PageElementProperties
}

export interface CreateSlidesTableRequest {
  objectId?: string
  elementProperties: PageElementProperties
  rows: number
  columns: number
}

export interface InsertTableRowsRequest {
  tableObjectId: string
  cellLocation: TableCellLocationSlide
  insertBelow: boolean
  number: number
}

export interface InsertTableColumnsRequest {
  tableObjectId: string
  cellLocation: TableCellLocationSlide
  insertRight: boolean
  number: number
}

export interface DeleteTableRowSlidesRequest {
  tableObjectId: string
  cellLocation: TableCellLocationSlide
}

export interface DeleteTableColumnSlidesRequest {
  tableObjectId: string
  cellLocation: TableCellLocationSlide
}

// Slides API Params
export interface GetPresentationParams {
  presentationId: string
}

export interface CreatePresentationParams {
  title: string
}

export interface CreateSlideParams {
  presentationId: string
  insertionIndex?: number
  layout?: 'BLANK' | 'CAPTION_ONLY' | 'TITLE' | 'TITLE_AND_BODY' | 'TITLE_AND_TWO_COLUMNS' | 'TITLE_ONLY' | 'SECTION_HEADER' | 'SECTION_TITLE_AND_DESCRIPTION' | 'ONE_COLUMN_TEXT' | 'MAIN_POINT' | 'BIG_NUMBER'
}

export interface DeleteSlideParams {
  presentationId: string
  slideObjectId: string
}

export interface DuplicateSlideParams {
  presentationId: string
  slideObjectId: string
}

export interface InsertSlideTextParams {
  presentationId: string
  shapeObjectId: string
  text: string
  insertionIndex?: number
}

export interface ReplaceSlideTextParams {
  presentationId: string
  findText: string
  replaceText: string
  matchCase?: boolean
  slideObjectIds?: string[]
}

export interface InsertSlideImageParams {
  presentationId: string
  slideObjectId: string
  imageUrl: string
  width?: number
  height?: number
  translateX?: number
  translateY?: number
}

// ============================================================================
// Forms Types
// ============================================================================

export interface Form {
  formId: string
  info: FormInfo
  settings?: FormSettings
  items?: FormItem[]
  revisionId?: string
  responderUri?: string
  linkedSheetId?: string
}

export interface FormInfo {
  title: string
  documentTitle?: string
  description?: string
}

export interface FormSettings {
  quizSettings?: QuizSettings
}

export interface QuizSettings {
  isQuiz?: boolean
}

export interface FormItem {
  itemId: string
  title?: string
  description?: string
  questionItem?: QuestionItem
  questionGroupItem?: QuestionGroupItem
  pageBreakItem?: Record<string, unknown>
  textItem?: Record<string, unknown>
  imageItem?: ImageItem
  videoItem?: VideoItem
}

export interface QuestionItem {
  question: Question
  image?: FormImage
}

export interface Question {
  questionId: string
  required?: boolean
  grading?: Grading
  choiceQuestion?: ChoiceQuestion
  textQuestion?: TextQuestion
  scaleQuestion?: ScaleQuestion
  dateQuestion?: DateQuestion
  timeQuestion?: TimeQuestion
  fileUploadQuestion?: FileUploadQuestion
  rowQuestion?: RowQuestion
}

export interface Grading {
  pointValue: number
  correctAnswers?: CorrectAnswers
  whenRight?: Feedback
  whenWrong?: Feedback
  generalFeedback?: Feedback
}

export interface CorrectAnswers {
  answers: CorrectAnswer[]
}

export interface CorrectAnswer {
  value: string
}

export interface Feedback {
  text: string
  material?: ExtraMaterial[]
}

export interface ExtraMaterial {
  link?: TextLink
  video?: VideoLink
}

export interface TextLink {
  uri: string
  displayText?: string
}

export interface VideoLink {
  displayText?: string
  youtubeUri?: string
}

export interface ChoiceQuestion {
  type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN'
  options: Option[]
  shuffle?: boolean
}

export interface Option {
  value: string
  image?: FormImage
  isOther?: boolean
  goToAction?: 'NEXT_SECTION' | 'RESTART_FORM' | 'SUBMIT_FORM'
  goToSectionId?: string
}

export interface FormImage {
  contentUri?: string
  altText?: string
  properties?: MediaProperties
  sourceUri?: string
}

export interface MediaProperties {
  alignment?: 'LEFT' | 'RIGHT' | 'CENTER'
  width?: number
}

export interface TextQuestion {
  paragraph?: boolean
}

export interface ScaleQuestion {
  low: number
  high: number
  lowLabel?: string
  highLabel?: string
}

export interface DateQuestion {
  includeTime?: boolean
  includeYear?: boolean
}

export interface TimeQuestion {
  duration?: boolean
}

export interface FileUploadQuestion {
  folderId: string
  types?: string[]
  maxFiles?: number
  maxFileSize?: string
}

export interface RowQuestion {
  title: string
}

export interface QuestionGroupItem {
  questions: Question[]
  image?: FormImage
  grid?: Grid
}

export interface Grid {
  columns: ChoiceQuestion
  shuffleQuestions?: boolean
}

export interface ImageItem {
  image: FormImage
}

export interface VideoItem {
  video: Video
  caption?: string
}

// Form Responses
export interface FormResponse {
  formId: string
  responseId: string
  createTime: string
  lastSubmittedTime: string
  respondentEmail?: string
  answers?: Record<string, Answer>
  totalScore?: number
}

export interface Answer {
  questionId: string
  grade?: Grade
  textAnswers?: TextAnswers
  fileUploadAnswers?: FileUploadAnswers
}

export interface Grade {
  score: number
  correct?: boolean
  feedback?: Feedback
}

export interface TextAnswers {
  answers: TextAnswer[]
}

export interface TextAnswer {
  value: string
}

export interface FileUploadAnswers {
  answers: FileUploadAnswer[]
}

export interface FileUploadAnswer {
  fileId: string
  fileName: string
  mimeType: string
}

export interface ListFormResponsesResponse {
  responses?: FormResponse[]
  nextPageToken?: string
}

// Form Watch (for notifications)
export interface Watch {
  id: string
  createTime: string
  expireTime: string
  eventType: 'RESPONSES' | 'SCHEMA'
  target: WatchTarget
  state: 'ACTIVE' | 'SUSPENDED'
  errorType?: string
}

export interface WatchTarget {
  topic: CloudPubSubTopic
}

export interface CloudPubSubTopic {
  topicName: string
}

// Forms API Params
export interface GetFormParams {
  formId: string
}

export interface CreateFormParams {
  title: string
  documentTitle?: string
}

export interface BatchUpdateFormParams {
  formId: string
  requests: FormRequest[]
}

export interface FormRequest {
  createItem?: CreateItemRequest
  updateItem?: UpdateItemRequest
  deleteItem?: DeleteItemRequest
  moveItem?: MoveItemRequest
  updateFormInfo?: UpdateFormInfoRequest
  updateSettings?: UpdateSettingsRequest
  [key: string]: unknown
}

export interface CreateItemRequest {
  item: FormItem
  location: FormLocation
}

export interface FormLocation {
  index?: number
}

export interface UpdateItemRequest {
  item: FormItem
  location: FormLocation
  updateMask: string
}

export interface DeleteItemRequest {
  location: FormLocation
}

export interface MoveItemRequest {
  originalLocation: FormLocation
  newLocation: FormLocation
}

export interface UpdateFormInfoRequest {
  info: FormInfo
  updateMask: string
}

export interface UpdateSettingsRequest {
  settings: FormSettings
  updateMask: string
}

export interface BatchUpdateFormResponse {
  form?: Form
  replies?: FormReply[]
  writeControl?: WriteControl
}

export interface FormReply {
  createItem?: CreateItemResponse
  [key: string]: unknown
}

export interface CreateItemResponse {
  itemId: string
  questionId?: string[]
}

export interface ListFormResponsesParams {
  formId: string
  pageSize?: number
  pageToken?: string
  filter?: string
}

export interface GetFormResponseParams {
  formId: string
  responseId: string
}

export interface CreateWatchParams {
  formId: string
  eventType: 'RESPONSES' | 'SCHEMA'
  topicName: string
}

export interface DeleteWatchParams {
  formId: string
  watchId: string
}

// ============================================================================
// Google Meet Types
// ============================================================================

/**
 * A Google Meet space (meeting room)
 */
export interface MeetSpace {
  /** Unique identifier for the space */
  name: string
  /** Meeting code users can use to join */
  meetingCode: string
  /** Web link to join the meeting */
  meetingUri: string
  /** Access configuration */
  config?: MeetSpaceConfig
  /** Active conference details (if a meeting is in progress) */
  activeConference?: ActiveConference
}

export interface MeetSpaceConfig {
  /** Access type: OPEN, TRUSTED, RESTRICTED */
  accessType?: 'ACCESS_TYPE_UNSPECIFIED' | 'OPEN' | 'TRUSTED' | 'RESTRICTED'
  /** Entry point access: ALL, CREATOR_APP_ONLY */
  entryPointAccess?: 'ENTRY_POINT_ACCESS_UNSPECIFIED' | 'ALL' | 'CREATOR_APP_ONLY'
}

export interface ActiveConference {
  /** Conference ID */
  conferenceRecord: string
}

export interface ConferenceRecord {
  /** Resource name */
  name: string
  /** Start time */
  startTime: string
  /** End time (if ended) */
  endTime?: string
  /** The space that hosted the conference */
  space: string
}

export interface Participant {
  /** Resource name */
  name: string
  /** User resource (if authenticated) */
  signedinUser?: {
    user: string
    displayName: string
  }
  /** Anonymous user (if not authenticated) */
  anonymousUser?: {
    displayName: string
  }
  /** Phone user */
  phoneUser?: {
    displayName: string
  }
  /** Earliest start time of the participant's session */
  earliestStartTime: string
  /** Latest end time of the participant's session */
  latestEndTime?: string
}

export interface Recording {
  /** Resource name */
  name: string
  /** Recording state */
  state: 'STATE_UNSPECIFIED' | 'STARTED' | 'ENDED' | 'FILE_GENERATED'
  /** Start time */
  startTime: string
  /** End time */
  endTime?: string
  /** Drive file destination */
  driveDestination?: {
    file: string
    exportUri: string
  }
}

export interface Transcript {
  /** Resource name */
  name: string
  /** Transcript state */
  state: 'STATE_UNSPECIFIED' | 'STARTED' | 'ENDED' | 'FILE_GENERATED'
  /** Start time */
  startTime: string
  /** End time */
  endTime?: string
  /** Docs destination */
  docsDestination?: {
    document: string
    exportUri: string
  }
}

// Meet API Params

export interface CreateMeetSpaceParams {
  /** Access type for the meeting */
  accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED'
}

export interface GetMeetSpaceParams {
  /** Space name (format: spaces/{space}) or meeting code */
  spaceName: string
}

export interface EndActiveConferenceParams {
  /** Space name (format: spaces/{space}) */
  spaceName: string
}

export interface ListConferenceRecordsParams {
  /** Filter by space (format: space_name="spaces/{space}") */
  filter?: string
  pageSize?: number
  pageToken?: string
}

export interface ListConferenceRecordsResponse {
  conferenceRecords: ConferenceRecord[]
  nextPageToken?: string
}

export interface ListParticipantsParams {
  /** Conference record name (format: conferenceRecords/{record}) */
  conferenceRecordName: string
  pageSize?: number
  pageToken?: string
}

export interface ListParticipantsResponse {
  participants: Participant[]
  nextPageToken?: string
}

export interface ListRecordingsParams {
  /** Conference record name (format: conferenceRecords/{record}) */
  conferenceRecordName: string
  pageSize?: number
  pageToken?: string
}

export interface ListRecordingsResponse {
  recordings: Recording[]
  nextPageToken?: string
}

export interface ListTranscriptsParams {
  /** Conference record name (format: conferenceRecords/{record}) */
  conferenceRecordName: string
  pageSize?: number
  pageToken?: string
}

export interface ListTranscriptsResponse {
  transcripts: Transcript[]
  nextPageToken?: string
}

// ============================================================================
// API Responses
// ============================================================================

export interface ListMessagesResponse {
  messages: Array<{ id: string; threadId: string }>
  nextPageToken?: string
  resultSizeEstimate: number
}

export interface ListEventsResponse {
  items: CalendarEvent[]
  nextPageToken?: string
  summary?: string
  timeZone?: string
}

export interface ListCalendarsResponse {
  items: CalendarList[]
  nextPageToken?: string
}
