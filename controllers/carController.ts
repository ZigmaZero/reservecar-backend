import AuthenticatedRequest from "../interfaces/authenticatedRequest.js";
import logger from "../logger.js";
import { createCar, deleteCar, getCarById, getCars, getCarsCount, updateCar } from "../services/carService.js";
import { getTeamById } from "../services/teamService.js";
import { Response } from 'express';

export function carCreateController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const { plateNumber, teamId } = req.body;

    if (typeof plateNumber !== 'string'
      || plateNumber.trim() === ''
      || typeof teamId !== 'number'
      || !Number.isInteger(teamId)) {
      res.status(400).json({ error: 'Invalid plateNumber or teamId.' });
      return;
    }

    const team = getTeamById(teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }

    try {
      const result = createCar(plateNumber.trim(), teamId);
      if (result.changes === 0) {
        res.status(400).json({ error: 'Failed to create car. Please check the input.' });
        return;
      }
      res.status(201).json({ success: true });
    } catch (error) {
      logger.error("Error creating car:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

export function carDeleteController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const carId = parseInt(req.params.carId, 10);

    if (isNaN(carId) || !Number.isInteger(carId)) {
      res.status(400).json({ error: 'Invalid carId. It must be an integer.' });
      return;
    }

    try {
      const result = deleteCar(carId, new Date().toISOString());

      if (result.changes === 0) {
        res.status(404).json({ error: 'Car not found.' });
        return;
      }

      res.status(200).json({ message: 'Car deleted successfully.' });
    } catch (error) {
      logger.error("Error deleting car:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

export function carGetByIdController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const carId = parseInt(req.params.carId, 10);

    if (isNaN(carId) || !Number.isInteger(carId)) {
      res.status(400).json({ error: 'Invalid carId. It must be an integer.' });
      return;
    }

    try {
      const car = getCarById(carId);

      if (!car) {
        res.status(404).json({ error: 'Car not found.' });
        return;
      }

      res.status(200).json(car);
    } catch (error) {
      logger.error("Error fetching car:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

export function carGetPaginatedController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 0;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
    const sortField = req.query.sortField ? req.query.sortField as string : undefined;
    const sortOrder = req.query.sortOrder ? req.query.sortOrder as string : undefined;
    const filterField = req.query.filterField ? req.query.filterField as string : undefined;
    const filterOp = req.query.filterOp ? req.query.filterOp as string : undefined;
    const filterValue = req.query.filterValue ? req.query.filterValue as string : undefined;

    if (page < 0 || pageSize < 1) {
      res.status(400).json({ error: 'Invalid page or pageSize.' });
      return;
    }
    const offset = page * pageSize;

    if (sortField !== "id" && sortField !== "plateNumber" && sortField !== "teamName" && sortField !== undefined) {
      res.status(400).json({ error: 'Invalid sortField.' });
      return;
    }

    if (sortOrder !== "asc" && sortOrder !== "desc" && sortOrder !== undefined) {
      res.status(400).json({ error: 'Invalid sortOrder.' });
      return;
    }

    if (filterField !== "id" && filterField !== "plateNumber" && filterField !== "teamId" && filterField !== "teamName" && filterField !== undefined) {
      res.status(400).json({ error: 'Invalid filterField. ' });
      return;
    }

    if (filterOp !== "=" && filterOp !== "contains" && filterOp !== undefined) {
      res.status(400).json({ error: 'Invalid filterOp. ' });
      return;
    }

    if (filterField === "id" || filterField === "teamId") {
      if (filterOp !== "=") {
        res.status(400).json({ error: 'Invalid filterOp. ' });
        return;
      }
    }

    if (filterField === "plateNumber" || filterField === "teamName") {
      if (filterOp !== "contains") {
        res.status(400).json({ error: 'Invalid filterOp. ' });
        return;
      }
    }

    try {
      const total = getCarsCount();
      const cars = getCars(pageSize, offset, sortField, sortOrder, filterField, filterOp, filterValue);

      res.status(200).json({
        data: cars,
        total,
        page,
        pageSize,
        maxPages: Math.max(1, Math.ceil(total / pageSize))
      });
    } catch (error) {
      logger.error("Error fetching cars:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

export function carUpdateController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const carId = parseInt(req.params.carId, 10);
    const { plateNumber, teamId } = req.body;

    if (isNaN(carId)
      || !Number.isInteger(carId)
      || typeof plateNumber !== 'string'
      || plateNumber.trim() === ''
      || typeof teamId !== 'number'
      || !Number.isInteger(teamId)) {
      res.status(400).json({ error: 'Invalid carId, plateNumber, or teamId.' });
      return;
    }

    try {
      const result = updateCar(carId, plateNumber.trim(), teamId);

      if (result.changes === 0) {
        res.status(404).json({ error: 'Car not found.' });
        return;
      }

      res.status(200).json({ message: 'Car updated successfully.' });
    } catch (error) {
      logger.error("Error updating car:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}