// Import các module cần thiết
const router = require('express').Router(); // Tạo một đối tượng Router để quản lý các route
const CategoryModel = require('../models/category'); // Import model cho danh mục (Category)
const Charset = require('../modules/charset'); // Module để xử lý charset, như loại bỏ dấu tiếng Việt
const Passport = require('../modules/passport'); // Module để xử lý xác thực người dùng

// Route: Trang chủ danh mục, chuyển hướng đến danh sách
router.get('/', Passport.requireAuth, (req, res) => {
  res.redirect('/admin/category/danh-sach.html'); 
});

// Route: Hiển thị danh sách các danh mục
router.get('/danh-sach.html', Passport.requireAuth, async (req, res) => {
  const model = {};
  // Truy vấn các danh mục không bị xóa (isDeleted: false)
  model.data = await CategoryModel.find({ isDeleted: false }).lean(); 
  // Render giao diện danh sách danh mục
  res.render('admin/category/list', model); 
});

// Route: Hiển thị form thêm danh mục mới
router.get('/them.html', Passport.requireAuth, (req, res) => {
  res.render('admin/category/create', { errors: null }); // Hiển thị form với danh sách lỗi trống
});

// Route: Xử lý thêm danh mục mới
router.post('/them.html', Passport.requireAuth, async (req, res) => {
  // Kiểm tra dữ liệu đầu vào: không được rỗng, độ dài từ 5 đến 32 ký tự
  req.checkBody('name', 'Giá Trị không được rỗng').notEmpty();
  req.checkBody('name', 'Name từ 5 đến 32 ký tự').isLength({ min: 5, max: 32 });

  const errors = req.validationErrors(); // Lấy danh sách lỗi

  if (errors) {
    // Nếu có lỗi, render lại form với thông báo lỗi
    return res.render('admin/category/create', { errors });
  }

  // Thêm danh mục mới vào cơ sở dữ liệu
  await CategoryModel.create({
    name: req.body.name,
    urlRewriteName: Charset.removeUnicode(req.body.name), // Xử lý URL dạng không dấu
    isDeleted: false
  });

  req.flash('response_message', 'Đã Thêm Thành Công'); // Thông báo thành công
  res.redirect('/admin/category/them.html'); // Chuyển hướng về trang thêm danh mục
});

// Route: Hiển thị form chỉnh sửa danh mục theo ID
router.get('/sua/:id.html', Passport.requireAuth, async (req, res) => {
  const docCategory = await CategoryModel.findOne({ id: req.params.id, isDeleted: false }).lean();
  res.render('admin/category/edit', { errors: null, data: docCategory }); // Render form với dữ liệu hiện tại
});

// Route: Xử lý chỉnh sửa danh mục
router.post('/sua/:id.html', Passport.requireAuth, async (req, res) => {
  const docCategory = await CategoryModel.findOne({ id: req.params.id, isDeleted: false }).lean();

  // Kiểm tra dữ liệu đầu vào như trong thêm mới
  req.checkBody('name', 'Giá Trị không được rỗng').notEmpty();
  req.checkBody('name', 'Name từ 5 đến 32 ký tự').isLength({ min: 5, max: 32 });

  const errors = req.validationErrors();

  if (errors) {
    return res.render('admin/category/edit', { errors, data: docCategory });
  }

  // Cập nhật dữ liệu danh mục
  await CategoryModel.update(
    { id: docCategory.id },
    {
      name: req.body.name,
      urlRewriteName: Charset.removeUnicode(req.body.name)
    }
  );

  req.flash('response_message', 'Đã Sửa Thành Công');
  res.redirect(`/admin/category/sua/${req.params.id}.html`);
});

// Route: Xóa danh mục theo ID
router.get('/xoa/:id', Passport.requireAuth, async (req, res) => {
  const docCategory = await CategoryModel.findOne({ id: req.params.id, isDeleted: false }).lean();

  if (!docCategory || !docCategory.id) {
    req.flash('response_message', 'Tham Số Đầu Vào Không Hợp Lệ');
  } else {
    await CategoryModel.update({ id: docCategory.id }, { isDeleted: true }); // Đánh dấu là đã xóa
    req.flash('response_message', 'Đã Xoá Thành Công');
  }

  res.redirect('/admin/category/danh-sach.html'); // Chuyển hướng về danh sách
});

// Xuất module router để sử dụng ở nơi khác
module.exports = router;
