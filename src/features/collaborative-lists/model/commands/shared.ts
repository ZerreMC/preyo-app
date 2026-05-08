import type {DomainError, Uuid} from '../../domain/ShoppingList';
import {RepositoryError} from '../ports/ListRepository';

export type CommandError =
    | DomainError
    | { kind: 'LIST_NOT_FOUND'; listId: Uuid }
    | { kind: 'UNAUTHORIZED' }
    | { kind: 'FORBIDDEN' }
    | { kind: 'USER_NOT_FOUND' }
    | { kind: 'INVITE_USED' }
    | { kind: 'INVITE_EXPIRED' };

export function mapRepositoryError(error: RepositoryError, listId?: Uuid): CommandError {
    switch (error.code) {
        case 'UNAUTHORIZED':
            return {kind: 'UNAUTHORIZED'};
        case 'FORBIDDEN':
            return {kind: 'FORBIDDEN'};
        case 'NOT_FOUND':
            return {kind: 'LIST_NOT_FOUND', listId: listId ?? ('' as Uuid)};
        case 'USER_NOT_FOUND':
            return {kind: 'USER_NOT_FOUND'};
        case 'INVITE_USED':
            return {kind: 'INVITE_USED'};
        case 'INVITE_EXPIRED':
            return {kind: 'INVITE_EXPIRED'};
        case 'LIST_LOCKED':
            return {kind: 'LIST_LOCKED', status: 'archived'};
        case 'DUPLICATE_PRODUCT':
            return {kind: 'DUPLICATE_PRODUCT', productRef: ''};
        case 'CAPACITY_EXCEEDED':
            return {kind: 'CAPACITY_EXCEEDED', current: 0, limit: 0};
        case 'ITEM_NOT_FOUND':
            return {kind: 'ITEM_NOT_FOUND', id: '' as Uuid};
        default:
            return {kind: 'INVALID_INPUT', message: error.message};
    }
}
