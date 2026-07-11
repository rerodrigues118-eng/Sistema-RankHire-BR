import test from 'node:test';
import assert from 'node:assert/strict';
import { getPlanAccessState } from '../src/lib/planos';

test('trial starter blocks PDF uploads at the limit', () => {
  const state = getPlanAccessState({ plano: 'trial_starter', subscription_status: 'trialing' } as any, 10);

  assert.equal(state.isTrial, true);
  assert.equal(state.canUploadPdf, false);
  assert.equal(state.pdfLimit, 10);
  assert.equal(state.canUseLinkedIn, false);
});

test('starter plan allows uploads and LinkedIn for active subscriptions', () => {
  const state = getPlanAccessState({ plano: 'starter', subscription_status: 'active' } as any, 99);

  assert.equal(state.isTrial, false);
  assert.equal(state.canUploadPdf, true);
  assert.equal(state.canUseLinkedIn, true);
  assert.equal(state.pdfLimit, 100);
});
