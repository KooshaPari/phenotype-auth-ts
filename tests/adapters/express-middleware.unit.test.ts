/**
 * Unit tests for Express middleware.
 *
 * xDD Methodologies:
 * - TDD: Test-first for middleware behavior
 * - BDD: Given-When-Then scenario format
 *
 * Traces to: FR-MW-001, FR-MW-002, FR-MW-003
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthMiddleware, requireScope } from '../../src/adapters/express-middleware';
import { PlaceholderJwtVerifier } from '../../src/adapters/jwt-provider';
import type { Request, Response, NextFunction } from 'express';

// Mock Express types
const createMockRequest = (overrides: Partial<Request> = {}): Request => ({
  headers: {},
  ...overrides,
} as unknown as Request);

const createMockResponse = (): Response => {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

const createMockNext = (): NextFunction => vi.fn();

describe('createAuthMiddleware', () => {
  let verifier: PlaceholderJwtVerifier;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    verifier = new PlaceholderJwtVerifier();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('missing authorization header', () => {
    // Traces to: FR-MW-001
    it('BDD: Given no Authorization header, When request comes, Then returns 401', async () => {
      const middleware = createAuthMiddleware({ verifier });
      mockReq = createMockRequest({ headers: {} });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'unauthorized' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Traces to: FR-MW-001
    it('BDD: Given invalid Authorization header format, When request comes, Then returns 401', async () => {
      const middleware = createAuthMiddleware({ verifier });
      mockReq = createMockRequest({ headers: { authorization: 'InvalidFormat' } });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Traces to: FR-MW-001
    it('BDD: Given non-Bearer authorization, When request comes, Then returns 401', async () => {
      const middleware = createAuthMiddleware({ verifier });
      mockReq = createMockRequest({ headers: { authorization: 'Basic dXNlcjpwYXNz' } });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('token verification', () => {
    // Traces to: FR-MW-001, FR-MW-003
    it('TDD: Given PlaceholderJwtVerifier throws, When request comes, Then returns 401', async () => {
      const middleware = createAuthMiddleware({ verifier });
      mockReq = createMockRequest({ headers: { authorization: 'Bearer test-token' } });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('custom error handler', () => {
    // Traces to: FR-MW-003
    it('TDD: Given custom error handler, When verification fails, Then custom handler is called', async () => {
      const customHandler = vi.fn();
      const middleware = createAuthMiddleware({
        verifier,
        onError: customHandler,
      });
      mockReq = createMockRequest({ headers: { authorization: 'Bearer test-token' } });

      await middleware(mockReq, mockRes, mockNext);

      expect(customHandler).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('requireScope', () => {
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('scope validation', () => {
    // Traces to: FR-MW-002
    it('TDD: Given user with required scope, When validating, Then calls next', () => {
      mockReq = createMockRequest({ user: { scope: 'read write admin' } as any });
      const middleware = requireScope('read');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    // Traces to: FR-MW-002
    it('TDD: Given user without required scope, When validating, Then returns 403', () => {
      mockReq = createMockRequest({ user: { scope: 'read' } as any });
      const middleware = requireScope('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'insufficient_scope' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Traces to: FR-MW-002
    it('TDD: Given multiple required scopes, When user has all, Then calls next', () => {
      mockReq = createMockRequest({ user: { scope: 'read write admin' } as any });
      const middleware = requireScope('read', 'admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    // Traces to: FR-MW-002
    it('TDD: Given multiple required scopes, When user missing one, Then returns 403', () => {
      mockReq = createMockRequest({ user: { scope: 'read' } as any });
      const middleware = requireScope('read', 'admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Traces to: FR-MW-002
    it('TDD: Given no user on request, When validating, Then returns 403', () => {
      mockReq = createMockRequest({ user: undefined });
      const middleware = requireScope('read');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
