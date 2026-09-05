import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMyFollowing, toggleFollow } from './following';

const mocks = vi.hoisted(() => ({
  getSupabase: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  companyOrder: vi.fn(),
  groupOrder: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  getSupabase: mocks.getSupabase,
}));

function makeQuery(order: ReturnType<typeof vi.fn>) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order,
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

describe('following API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const companyQuery = makeQuery(mocks.companyOrder);
    const groupQuery = makeQuery(mocks.groupOrder);
    mocks.from.mockImplementation((table: string) => (
      table === 'company_follows' ? companyQuery : groupQuery
    ));
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mocks.companyOrder.mockResolvedValue({
      data: [
        { company_id: '11111111-1111-4111-8111-111111111111' },
        { company_id: '11111111-1111-4111-8111-111111111111' },
      ],
      error: null,
    });
    mocks.groupOrder.mockResolvedValue({
      data: [{ group_id: '22222222-2222-4222-8222-222222222222' }],
      error: null,
    });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.getSupabase.mockReturnValue({
      auth: { getUser: mocks.getUser },
      from: mocks.from,
      rpc: mocks.rpc,
    });
  });

  it('reads only the signed-in user relationships and removes duplicate ids', async () => {
    await expect(getMyFollowing()).resolves.toEqual({
      companyIds: ['11111111-1111-4111-8111-111111111111'],
      groupIds: ['22222222-2222-4222-8222-222222222222'],
    });

    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.from).toHaveBeenCalledWith('company_follows');
    expect(mocks.from).toHaveBeenCalledWith('group_follows');
    expect(mocks.companyOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mocks.groupOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('requires auth and routes company toggles through the bound RPC', async () => {
    await expect(toggleFollow(
      'company',
      '11111111-1111-4111-8111-111111111111',
      true,
    )).resolves.toBe(true);

    expect(mocks.rpc).toHaveBeenCalledWith('toggle_company_follow', {
      p_company_id: '11111111-1111-4111-8111-111111111111',
      p_follow: true,
    });
  });

  it('rejects malformed target ids before making a request', async () => {
    await expect(toggleFollow('group', 'not-a-uuid', true)).rejects.toMatchObject({
      code: 'INVALID_TARGET',
    });
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('rejects unknown target types before making a request', async () => {
    await expect(toggleFollow(
      'label' as 'company',
      '11111111-1111-4111-8111-111111111111',
      true,
    )).rejects.toMatchObject({ code: 'INVALID_TARGET' });
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated reads and writes', async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(getMyFollowing()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
    expect(mocks.from).not.toHaveBeenCalled();

    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(toggleFollow(
      'group',
      '22222222-2222-4222-8222-222222222222',
      true,
    )).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
