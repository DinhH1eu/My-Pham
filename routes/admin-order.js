// Import các module cần thiết
const router = require('express').Router(); // Tạo một router để xử lý các route liên quan đến đơn hàng
const OrderModel = require('../models/order'); // Import model Order để tương tác với cơ sở dữ liệu
const OrderStatus = require('../constants/order-status'); // Import các trạng thái đơn hàng
const Passport = require('../modules/passport'); // Middleware để kiểm tra xác thực người dùng
const moment = require('moment'); // Thư viện hỗ trợ xử lý và định dạng thời gian

// Route: Trang chủ đơn hàng, chuyển hướng đến danh sách đơn hàng
router.get('/', Passport.requireAuth, async (req, res) => {
  res.redirect('/admin/order/danh-sach.html');
});

// Route: Hiển thị danh sách đơn hàng
router.get('/danh-sach.html', Passport.requireAuth, async (req, res) => {
  const model = {};
  // Truy vấn các đơn hàng chưa bị xóa
  model.data = await OrderModel.find({ isDeleted: false }).lean();
  // Render giao diện danh sách đơn hàng với dữ liệu và thư viện moment
  res.render('admin/order/list', { model, moment });
});

// Route: Hiển thị chi tiết đơn hàng theo ID
router.get('/chi-tiet/:id.html', Passport.requireAuth, async (req, res) => {
  const model = {};
  // Truy vấn đơn hàng cụ thể theo ID
  model.order = await OrderModel.findOne({ id: req.params.id, isDeleted: false }).lean();
  // Render giao diện chi tiết đơn hàng
  res.render('admin/order/detail', model);
});

// Route: Cập nhật trạng thái thanh toán đơn hàng
router.get('/thanh-toan/:id', Passport.requireAuth, async (req, res) => {
  const docOrder = await OrderModel.findOne({
    id: req.params.id,
    isDeleted: false,
    status: OrderStatus.submit, // Chỉ cập nhật đơn hàng ở trạng thái "submit"
  }).lean();

  // Kiểm tra điều kiện và cập nhật trạng thái
  if (!docOrder || !docOrder.id) {
    req.flash('response_message', 'Tham Số Đầu Vào Không Hợp Lệ');
  } else {
    await OrderModel.updateOne({ id: docOrder.id }, { status: OrderStatus.paid }); // Chuyển trạng thái sang "paid"
    req.flash('response_message', 'Cập Nhật Thành Công');
  }

  res.redirect(`/admin/order/chi-tiet/${req.params.id}.html`);
});

// Route: Xóa đơn hàng theo ID
router.get('/xoa/:id', Passport.requireAuth, async (req, res) => {
  const docOrder = await OrderModel.findOne(
    { id: req.params.id }, // Tìm đơn hàng theo ID
    { id: 1 } // Chỉ lấy trường "id"
  ).lean();

  let sMessage;

  if (!docOrder || !docOrder.id) {
    sMessage = 'Tham Số Đầu Vào Không Hợp Lệ';
  } else {
    const updated = await OrderModel.updateOne(
      { id: docOrder.id },
      { $set: { isDeleted: true } } // Đánh dấu đơn hàng đã xóa
    );

    if (!updated || typeof updated !== 'object' || updated.nModified !== 1) {
      sMessage = 'Có lỗi xảy ra';
    } else {
      sMessage = 'Đã Xoá Thành Công';
    }
  }

  req.flash('response_message', sMessage);
  res.redirect('/admin/order/danh-sach.html');
});

// Tìm đơn hàng theo số điện thoại (dữ liệu mẫu, chưa được gắn với route)
router.get('/danh-sach.html', Passport.requireAuth, async (req, res) => {
  const searchQuery = req.query.phone || ''; // Lấy số điện thoại từ query params
  const filter = { isDeleted: false };

  if (searchQuery.trim() !== '') {
    filter.phone = searchQuery.trim();
  }

  const model = {};
  model.data = await OrderModel.find(filter).lean();
  model.searchQuery = searchQuery;

  res.render('admin/order/list', {
    model,
    moment,
  });
});

module.exports = router; // Xuất router để sử dụng trong ứng dụng
