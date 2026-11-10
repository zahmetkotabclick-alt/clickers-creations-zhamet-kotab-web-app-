import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paymobRouter from "./paymob";
import booksRouter from "./books";
import notificationsRouter from "./notifications";
import campaignRouter from "./campaign";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/paymob", paymobRouter);
router.use("/books", booksRouter);
router.use("/notifications", notificationsRouter);
router.use("/campaign", campaignRouter);
router.use("/orders", ordersRouter);

export default router;
