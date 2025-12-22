# Hướng dẫn sử dụng hệ thống Authentication

## 🚀 Cài đặt và chạy

### 1. Khởi động Backend
```bash
cd e:\btgit\Luanvan\backend
npm install  # Nếu chưa cài
npm start    # Hoặc node server.js
```
Backend sẽ chạy ở `http://localhost:3000`

### 2. Khởi động Mobile App
```bash
cd e:\btgit\Luanvan\frontend_phone
npm install  # Đã cài rồi
npx expo start
```

## 📱 Test trên thiết bị

### Android Emulator
- Sử dụng API endpoint: `http://10.0.2.2:3000/api`
- File config đã được thiết lập sẵn

### Device thật (iOS/Android)
1. Tìm IP của máy tính chạy backend:
   - Windows: `ipconfig` -> tìm IPv4 Address
   - macOS/Linux: `ifconfig` -> tìm inet
2. Cập nhật trong `src/services/api.js`:
   ```javascript
   const BASE_URL = 'http://[IP_CUA_MAY_TINH]:3000/api';
   ```
3. Đảm bảo máy tính và device cùng mạng WiFi

## 🔐 Tài khoản test

Bạn cần tạo tài khoản trong database trước. Có thể dùng:

### Tạo tài khoản qua API:
```bash
curl -X POST http://localhost:3000/api/auth/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hotel.com",
    "name": "Administrator",
    "role": "admin"
  }'
```

### Hoặc tạo trực tiếp trong database:
```javascript
// Thêm vào MongoDB
{
  email: "admin@hotel.com",
  name: "Administrator", 
  password: "$2b$10$...", // Mật khẩu đã hash
  role: "admin"
}
```

## 🏗️ Cấu trúc đã tạo

### 1. Services (`src/services/`)
- `api.js`: Cấu hình axios với interceptors
- `authService.js`: Các function xử lý authentication

### 2. Context (`src/contexts/`)
- `AuthContext.js`: Quản lý state authentication toàn app

### 3. Screens
- `app/login.tsx`: Màn hình đăng nhập
- `app/loading.tsx`: Màn hình loading khi check auth
- `app/_layout.tsx`: Navigation logic dựa trên auth status
- `app/(tabs)/`: Màn hình chính sau khi đăng nhập

## 🔄 Flow Authentication

1. **App khởi động**: Check token trong AsyncStorage
2. **Chưa đăng nhập**: Redirect đến `/login`
3. **Đăng nhập thành công**: Lưu token, redirect đến `/(tabs)`
4. **Đăng xuất**: Xóa token, redirect đến `/login`

## 🛠️ Tính năng đã implement

✅ Đăng nhập với email/password  
✅ Lưu trữ token trong AsyncStorage  
✅ Auto logout khi token expire  
✅ Loading states  
✅ Error handling  
✅ Protected navigation  
✅ Hiển thị thông tin user  
✅ Đăng xuất với xác nhận  

## 🔧 Customize

### Thay đổi API endpoint:
Chỉnh sửa `BASE_URL` trong `src/services/api.js`

### Thêm field đăng nhập:
Cập nhật form trong `app/login.tsx` và service trong `authService.js`

### Thay đổi UI:
Các component đều có StyleSheet riêng, dễ dàng customize

## 🐛 Troubleshooting

### Lỗi kết nối API:
1. Check backend có đang chạy không
2. Check IP address trong config
3. Check CORS settings trong backend

### Lỗi navigation:
1. Đảm bảo AuthProvider wrap toàn app
2. Check file structure đúng theo Expo Router

### Lỗi AsyncStorage:
1. Đảm bảo đã cài đặt `@react-native-async-storage/async-storage`
2. Có thể cần link native modules

## 📝 Notes

- Backend sử dụng cookie authentication, mobile app simulate với token
- CORS đã được config cho cả emulator và device
- Token được tạo tự động khi login thành công
- App yêu cầu đăng nhập để access bất kỳ màn hình nào