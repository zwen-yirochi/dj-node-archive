// lib/api/index.ts
export { withAuth, withOptionalAuth, type AuthContext, type RouteParams } from './withAuth';
export {
    ApiErrors,
    successResponse,
    errorResponse,
    unauthorizedResponse,
    forbiddenResponse,
    notFoundResponse,
    validationErrorResponse,
    internalErrorResponse,
    zodValidationErrorResponse,
} from './responses';
export {
    verifyEntryOwnership,
    verifyEntriesOwnership,
    verifyDisplayEntryOwnership,
    verifyDisplayEntriesOwnership,
    verifyPageOwnership,
} from './ownership';
