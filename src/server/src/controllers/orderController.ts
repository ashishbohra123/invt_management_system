import type { Request, Response } from "express";
export const orderController = {
  list: async (_req: Request, res: Response) => { res.json([]); },
  create: async (req: Request, res: Response) => { res.status(201).json(req.body); },
  approve: async (req: Request, res: Response) => { res.json({ status: "approved", ...req.body }); },
  cancel: async (req: Request, res: Response) => { res.json({ status: "cancelled", ...req.body }); },
  update: async (req: Request, res: Response) => { res.json(req.body); },
  delete: async (_req: Request, res: Response) => { res.status(204).end(); },
};
