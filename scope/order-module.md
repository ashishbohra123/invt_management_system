# Order Module
**Portals:** Customer Portal (create/view), Partner Portal (approve/cancel)
**Dependencies:** Internal: Product (N:1), Tenant (N:1), User (approver/canceller FK), Inventory (approval decrements stock). Shared: @moc/shared/enums/order-statuses.
**API:** GET/POST /api/orders, PUT /api/orders/:id/approve, PUT /api/orders/:id/cancel
