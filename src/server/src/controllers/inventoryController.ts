import type { Request, Response } from "express";
export const inventoryController = { list: async (_req: Request, res: Response) => { res.json([]); }, create: async (req: Request, res: Response) => { res.status(201).json(req.body); }, update: async (req: Request, res: Response) => { res.json(req.body); }, delete: async (_req: Request, res: Response) => { res.status(204).end(); } };
