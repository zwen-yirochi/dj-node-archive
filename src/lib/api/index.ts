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
    verifyComponentOwnership,
    verifyComponentsOwnership,
    verifyViewItemOwnership,
    verifyViewItemsOwnership,
    verifyPageOwnership,
} from './ownership';
