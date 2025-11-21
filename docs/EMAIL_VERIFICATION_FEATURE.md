# Email Privacy & Verification Feature

## ✅ 实现的功能

### 1. Email 隐私保护
- Email 默认显示为 `cyj***@foxmail.com` 格式
- 只显示前3个字符 + `***` + 域名
- 保护用户隐私

### 2. Email 更改流程

#### Step 1: 验证当前 Email
1. 点击 "Change Email" 按钮
2. 输入当前完整的 email 地址
3. 点击 "Verify Current Email"
4. 系统验证是否匹配

#### Step 2: 输入新 Email
1. 输入新的 email 地址
2. 点击 "Send Verification Code"
3. 验证码会发送到新邮箱（开发环境会在控制台显示）

#### Step 3: 验证新 Email
1. 查收新邮箱的验证码
2. 输入6位数验证码
3. 点击 "Verify & Update"
4. Email 更新成功

## 🔧 开发环境测试

### 查看验证码
在开发环境中，验证码会显示在：

1. **浏览器控制台** (F12 → Console)
   ```
   [DEV] Verification code for test@example.com: 123456
   ```

2. **服务器终端**
   ```
   [DEV] Verification code for test@example.com: 123456
   ```

3. **API 响应** (开发环境)
   ```json
   {
     "success": true,
     "message": "Verification code sent",
     "code": "123456"
   }
   ```

### 测试步骤
1. 访问 http://localhost:3000/profile
2. 点击 "Change Email"
3. 输入当前 email（完整地址）
4. 输入新 email
5. 打开浏览器控制台查看验证码
6. 输入验证码完成更改

## 📧 生产环境配置

### 需要配置邮件服务

在生产环境中，需要集成真实的邮件服务。推荐方案：

#### 方案 1: SendGrid (推荐)
```bash
npm install @sendgrid/mail
```

```typescript
// src/app/api/auth/send-verification/route.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

async function sendEmailWithCode(email: string, code: string) {
  const msg = {
    to: email,
    from: 'noreply@foodbuddy.com',
    subject: 'Email Verification Code',
    text: `Your verification code is: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #4F46E5;">${code}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  await sgMail.send(msg);
  return true;
}
```

**环境变量**:
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
```

#### 方案 2: AWS SES
```bash
npm install @aws-sdk/client-ses
```

#### 方案 3: Nodemailer (自建SMTP)
```bash
npm install nodemailer
```

## 🔒 安全性

### 验证码保护
- ✅ 6位数字验证码
- ✅ 10分钟过期时间
- ✅ 使用后自动删除
- ✅ 定期清理过期验证码

### Email 验证流程
1. **双重验证**: 需要验证旧 email + 新 email
2. **防止误操作**: 必须输入完整的当前 email
3. **Firebase Auth 同步**: 同时更新 Firebase Authentication
4. **Firestore 更新**: 更新用户 profile 数据

### 生产环境建议
1. **使用 Redis** 存储验证码（替代内存 Map）
2. **限制发送频率**: 同一 email 每分钟最多1次
3. **IP 限制**: 防止暴力攻击
4. **验证码尝试次数**: 最多3次错误后需重新发送

## 📊 数据流程

```
用户点击 Change Email
    ↓
输入当前 email → 验证是否匹配
    ↓
输入新 email → 发送验证码到新邮箱
    ↓
输入验证码 → 验证是否正确
    ↓
更新 Firebase Auth email
    ↓
更新 Firestore profile.email
    ↓
完成！
```

## 🐛 故障排除

### 问题: 收不到验证码
**开发环境**: 查看浏览器控制台或服务器终端
**生产环境**: 检查邮件服务配置、垃圾邮件文件夹

### 问题: 验证码已过期
**解决**: 重新发送验证码（点击 "Resend Code"）

### 问题: 验证码错误
**解决**: 
1. 检查是否输入正确
2. 确认验证码没有过期
3. 重新发送新的验证码

### 问题: Firebase Auth 更新失败
**原因**: Email 可能已被其他用户使用
**解决**: 提示用户选择其他 email

## 📝 代码位置

- **前端组件**: `src/components/UserProfileForm.tsx`
- **验证码发送**: `src/app/api/auth/send-verification/route.ts`
- **验证码验证**: `src/app/api/auth/verify-and-update-email/route.ts`
- **Firebase Admin**: `src/lib/firebaseAdmin.ts`

## 🚀 未来优化

1. **邮件模板**: 设计更美观的 HTML 邮件模板
2. **多语言支持**: 邮件内容支持中英文
3. **SMS 验证**: 可选手机号验证
4. **邮箱验证历史**: 记录所有 email 更改历史
5. **安全通知**: 更改 email 后向旧邮箱发送通知
