// Messaging layer — typed UI ↔ Service Worker contract
export {
  // Request interfaces
  PanicCaptureRequest,
  GetSessionCountRequest,
  RestoreSessionRequest,
  DeleteSessionRequest,
  // Response interfaces and types
  SuccessResponse,
  ErrorResponse,
  TabManagerResponse,
  // Response data shapes
  PanicCaptureResult,
  SessionCountResult,
  // Union type for all requests
  TabManagerRequest,
} from './tab-manager-message.types';

export { MessageSenderService } from './message-sender.service';
