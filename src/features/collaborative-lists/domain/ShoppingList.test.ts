import { describe, it, expect } from 'vitest';
import { ShoppingList, DomainUuid } from './ShoppingList';

describe('ShoppingList Domain', () => {
    const defaultSnapshot = () => ({
        id: DomainUuid.new(),
        ownerId: DomainUuid.new(),
        title: 'Test List',
        status: 'draft' as const,
        transportCapacityG: 1000,
        items: []
    });

    const defaultItemInput = () => ({
        id: DomainUuid.new(),
        productRef: 'PROD-123',
        name: 'Apples',
        quantity: '1kg',
        estimatedWeightG: 500
    });

    it('addItem correcto', () => {
        const list = ShoppingList.hydrate(defaultSnapshot());
        const result = list.addItem(defaultItemInput());
        
        expect(result.ok).toBe(true);
        const snapshot = list.snapshot();
        expect(snapshot.items).toHaveLength(1);
        expect(snapshot.items[0].productRef).toBe('PROD-123');
        expect(snapshot.items[0].checked).toBe(false);
    });

    it('addItem duplicado', () => {
        const list = ShoppingList.hydrate(defaultSnapshot());
        const itemInput = defaultItemInput();
        
        list.addItem(itemInput);
        const result = list.addItem({ ...itemInput, id: DomainUuid.new() });
        
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.kind).toBe('DUPLICATE_PRODUCT');
        }
    });

    it('addItem supera capacidad', () => {
        const list = ShoppingList.hydrate({ ...defaultSnapshot(), transportCapacityG: 100 });
        const result = list.addItem({ ...defaultItemInput(), estimatedWeightG: 150 });
        
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.kind).toBe('CAPACITY_EXCEEDED');
        }
    });

    it('removeItem correcto', () => {
        const list = ShoppingList.hydrate(defaultSnapshot());
        const itemInput = defaultItemInput();
        
        list.addItem(itemInput);
        const result = list.removeItem(itemInput.id);
        
        expect(result.ok).toBe(true);
        expect(list.snapshot().items).toHaveLength(0);
    });

    it('toggleItem correcto', () => {
        const list = ShoppingList.hydrate(defaultSnapshot());
        const itemInput = defaultItemInput();
        
        list.addItem(itemInput);
        const result = list.toggleItem(itemInput.id, true);
        
        expect(result.ok).toBe(true);
        expect(list.snapshot().items[0].checked).toBe(true);
    });

    it('transición de estado válida', () => {
        const list = ShoppingList.hydrate(defaultSnapshot()); // draft
        const result = list.transitionTo('active');
        
        expect(result.ok).toBe(true);
        expect(list.snapshot().status).toBe('active');
    });

    it('transición inválida', () => {
        const list = ShoppingList.hydrate(defaultSnapshot()); // draft
        const result = list.transitionTo('shopping'); // invalid from draft
        
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.kind).toBe('INVALID_INPUT');
        }
    });
});
