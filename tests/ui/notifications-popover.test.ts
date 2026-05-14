import React from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {NotificationsPopover} from '../../src/features/notifications';
import type {AppNotification} from '../../src/features/notifications';

afterEach(() => cleanup());

describe('NotificationsPopover', () => {
    it('muestra empty state cuando no hay notificaciones', () => {
        render(React.createElement(NotificationsPopover, {
            open: true,
            notifications: [],
            loading: false,
            error: null,
            actingId: null,
            toast: null,
            onRefresh: vi.fn(),
            onMarkAllRead: vi.fn(),
            onMarkRead: vi.fn(),
            onAccept: vi.fn(),
            onReject: vi.fn(),
        }));

        expect(screen.getByText('Nada nuevo por aquí')).toBeTruthy();
    });

    it('muestra invitación pendiente con acciones Aceptar y Rechazar', () => {
        const onAccept = vi.fn();
        const onReject = vi.fn();
        const notification = createInviteNotification();

        render(React.createElement(NotificationsPopover, {
            open: true,
            notifications: [notification],
            loading: false,
            error: null,
            actingId: null,
            toast: null,
            onRefresh: vi.fn(),
            onMarkAllRead: vi.fn(),
            onMarkRead: vi.fn(),
            onAccept,
            onReject,
        }));

        expect(screen.getByText('Yisus te invitó a una lista')).toBeTruthy();
        expect(screen.getByText('Compra semanal')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', {name: /aceptar/i}));
        fireEvent.click(screen.getByRole('button', {name: /rechazar/i}));

        expect(onAccept).toHaveBeenCalledWith(notification);
        expect(onReject).toHaveBeenCalledWith(notification);
    });

    it('muestra toast de feedback', () => {
        render(React.createElement(NotificationsPopover, {
            open: true,
            notifications: [],
            loading: false,
            error: null,
            actingId: null,
            toast: {kind: 'success', message: 'Invitación aceptada'},
            onRefresh: vi.fn(),
            onMarkAllRead: vi.fn(),
            onMarkRead: vi.fn(),
            onAccept: vi.fn(),
            onReject: vi.fn(),
        }));

        expect(screen.getByText('Invitación aceptada')).toBeTruthy();
    });
});

function createInviteNotification(): AppNotification {
    return {
        id: 'notification-1',
        type: 'list_invite_received',
        title: 'Yisus te invitó a una lista',
        body: 'Compra semanal',
        metadata: {},
        readAt: null,
        resolvedAt: null,
        createdAt: new Date().toISOString(),
        actor: {
            id: 'actor-1',
            name: 'Yisus',
            avatarUrl: null,
            initials: 'Y',
        },
        list: {
            id: 'list-1',
            title: 'Compra semanal',
        },
        invite: {
            id: 'invite-1',
            role: 'VIEWER',
            email: 'juanjo@gmail.com',
            expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
            usedAt: null,
            revokedAt: null,
        },
    };
}
