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
} from './responses';
export {
    verifyEntryOwnership,
    verifyEntriesOwnership,
    verifyViewItemOwnership,
    verifyViewItemsOwnership,
    verifyPageOwnership,
    // Deprecated aliases
    verifyComponentOwnership,
    verifyComponentsOwnership,
} from './ownership';
