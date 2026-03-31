import {describe, it, expect, vi, beforeEach, type Mocked} from 'vitest';
import {AddItemCommandHandler} from './AddItemCommandHandler';
import {RepositoryError, type ListRepository, type RepositoryErrorCode} from '../ports/ListRepository';
import {ShoppingList, DomainUuid} from '../../domain/ShoppingList';
import type {Snapshot} from '../../domain/ShoppingList';

describe('AddItemCommandHandler', () => {
    let repository: Mocked<ListRepository>;
    let handler: AddItemCommandHandler;
    const listId = DomainUuid.new();
    const ownerId = DomainUuid.new();

    const createValidSnapshot = (): Snapshot => ({
        id: listId,
        ownerId,
        title: 'Title',
        status: 'draft',
        transportCapacityG: 1000,
        items: [],
    });

    const baseCommand = {
        listId,
        productRef: 'PROD-1',
        name: 'Apple',
        estimatedWeightG: 100,
    };

    beforeEach(() => {
        repository = {
            getByIdForWrite: vi.fn(),
            addItem: vi.fn(),
            removeItem: vi.fn(),
            toggleItem: vi.fn(),
            changeStatus: vi.fn(),
        } as unknown as Mocked<ListRepository>;
        handler = new AddItemCommandHandler(repository);
    });

    it('returns ok with the updated snapshot on success', async () => {
        const list = ShoppingList.hydrate(createValidSnapshot());
        repository.getByIdForWrite.mockResolvedValue(list);
        repository.addItem.mockResolvedValue();

        const result = await handler.execute(baseCommand);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.items).toHaveLength(1);
            expect(result.value.items[0].productRef).toBe('PROD-1');
        }
        expect(repository.addItem).toHaveBeenCalledOnce();
    });

    it('returns LIST_NOT_FOUND when the repository returns null', async () => {
        repository.getByIdForWrite.mockResolvedValue(null);

        const result = await handler.execute(baseCommand);

        expect(result).toEqual({ok: false, error: {kind: 'LIST_NOT_FOUND', listId}});
        expect(repository.addItem).not.toHaveBeenCalled();
    });

    it.each([
        ['UNAUTHORIZED', {kind: 'UNAUTHORIZED'}],
        ['FORBIDDEN', {kind: 'FORBIDDEN'}],
        ['NOT_FOUND', {kind: 'LIST_NOT_FOUND', listId}],
        ['LIST_LOCKED', {kind: 'LIST_LOCKED', status: 'draft'}],
        ['DUPLICATE_PRODUCT', {kind: 'DUPLICATE_PRODUCT', productRef: 'PROD-1'}],
        ['CAPACITY_EXCEEDED', {kind: 'CAPACITY_EXCEEDED', current: 0, limit: 1000}],
    ] as const)(
        'maps repository error %s to the expected command error',
        async (errorCode: RepositoryErrorCode, expectedError: Record<string, unknown>) => {
            const list = ShoppingList.hydrate(createValidSnapshot());
            repository.getByIdForWrite.mockResolvedValue(list);
            repository.addItem.mockRejectedValue(new RepositoryError(errorCode));

            const result = await handler.execute(baseCommand);

            expect(result).toEqual({ok: false, error: expectedError});
        },
    );

    it('rethrows unknown errors from the repository', async () => {
        const list = ShoppingList.hydrate(createValidSnapshot());
        repository.getByIdForWrite.mockResolvedValue(list);
        repository.addItem.mockRejectedValue(new Error('DB connection lost'));

        await expect(handler.execute(baseCommand)).rejects.toThrow('DB connection lost');
    });
});
