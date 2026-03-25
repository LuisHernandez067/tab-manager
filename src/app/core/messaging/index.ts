// Messaging layer — typed UI ↔ Service Worker contract
export {
  // Request interfaces
  CaptureRequest,
  GetSessionCountRequest,
  RestoreSessionRequest,
  DeleteSessionRequest,
  // Response interfaces and types
  SuccessResponse,
  ErrorResponse,
  TabManagerResponse,
  // Response data shapes
  CaptureResult,
  SessionCountResult,
  CaptureMode,
  CaptureScope,
  // Union type for all requests
  TabManagerRequest,
} from './tab-manager-message.types';

export { MessageSenderService } from './message-sender.service';
