"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = exports.OrderStatus = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const user_model_1 = require("./user.model");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pendente";
    OrderStatus["PREPARING"] = "preparando";
    OrderStatus["READY"] = "pronto";
    OrderStatus["DELIVERED"] = "entregue";
    OrderStatus["CANCELLED"] = "cancelado";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
let Order = class Order extends sequelize_typescript_1.Model {
};
exports.Order = Order;
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Order.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_model_1.User),
    (0, sequelize_typescript_1.AllowNull)(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Order.prototype, "attendantId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_model_1.User),
    __metadata("design:type", user_model_1.User)
], Order.prototype, "attendant", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_model_1.User),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Order.prototype, "kitchenUserId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_model_1.User, "kitchenUserId"),
    __metadata("design:type", user_model_1.User)
], Order.prototype, "kitchenUser", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.JSONB),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Default)(OrderStatus.PENDING),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.ENUM(...Object.values(OrderStatus))),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.DECIMAL(10, 2)),
    __metadata("design:type", Number)
], Order.prototype, "total", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Order.prototype, "tableNumber", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Order.prototype, "customerName", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Order.prototype, "observations", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Order.prototype, "closedAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Order.prototype, "startedAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Order.prototype, "readyAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Order.prototype, "deliveredAt", void 0);
exports.Order = Order = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: "orders",
        timestamps: true,
        underscored: true,
    })
], Order);
