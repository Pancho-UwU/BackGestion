import { barcode_controller } from "../controller/barCode.js";
import { Router } from "express";

const barCodeRouter = Router();

barCodeRouter.get('/barcodeimage/:barCodeId',barcode_controller.getSVG);

export default barCodeRouter;