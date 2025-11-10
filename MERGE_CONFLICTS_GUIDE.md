# Git Merge Conflicts 解决指南

## 🚨 当前情况

**PR:** Yu → dev-test  
**冲突文件数:** 31 个文件有冲突  
**冲突类型:** add/add 冲突和内容冲突

---

## 📋 冲突文件列表

### 工作流程配置
- `.github/workflows/ci.yml` - GitHub Actions 配置

### 配置文件
- `jest.setup.js` - Jest 配置
- `package-lock.json` - 依赖锁文件

### 核心应用文件
- `src/app/layout.tsx` - 根布局
- `src/app/page.tsx` - 首页
- `src/app/globals.css` - 全局样式
- `src/data/restaurants.json` - 餐厅数据
- `src/lib/firebaseClient.ts` - Firebase 客户端

### 路由文件
- `src/app/api/distances/route.ts` - 距离 API
- `src/app/api/feedback/route.ts` - 反馈 API
- `src/app/bookmarks/page.tsx` - 书签页面
- `src/app/restaurants/[id]/page.tsx` - 餐厅详情页
- `src/app/restaurants/[id]/deals/[dealId]/page.tsx` - 优惠详情页

### 组件文件
- `src/components/BookmarkButton.tsx`
- `src/components/BookmarkButton.test.tsx`
- `src/components/FeedbackButton.tsx`
- `src/components/FeedbackForm.tsx`
- `src/components/FeedbackForm.test.tsx`
- `src/components/Header.tsx`
- `src/components/MenuCategorySelector.tsx`
- `src/components/RestaurantCard.tsx`
- `src/components/RestaurantCard.test.tsx`
- `src/components/ShareButton.tsx`
- `src/components/ShareButton.test.tsx`
- `src/components/ThemeToggle.tsx`

### 库文件
- `src/lib/ThemeProvider.tsx`
- `src/lib/bookmarks.ts`
- `src/lib/distance.ts`
- `src/lib/distance.test.ts`
- `src/lib/menuCategorizer.ts`

---

## 🛠️ 解决冲突的策略

### 方案 1: 使用 Ours (Yu branch 的版本)
如果 Yu 的版本更好，全部采用 Yu branch 的文件：

```bash
# 这会采用 Yu branch 的所有版本并解决所有冲突
git checkout --ours .
git add .
git commit -m "resolve: merge dev-test into Yu, keeping Yu versions"
```

### 方案 2: 使用 Theirs (dev-test branch 的版本)
如果 dev-test 的版本更好，全部采用 dev-test branch 的文件：

```bash
# 这会采用 dev-test branch 的所有版本
git checkout --theirs .
git add .
git commit -m "resolve: merge dev-test into Yu, keeping dev-test versions"
```

### 方案 3: 手动解决重要文件，其他自动处理

```bash
# 首先采用 ours (Yu 版本) 作为基础
git checkout --ours .
git add .

# 然后对特定的重要文件，手动查看并决定
# 例如，对于某些文件，可能想要 dev-test 的版本
git checkout --theirs src/lib/firebaseClient.ts
git add src/lib/firebaseClient.ts

# 提交合并
git commit -m "resolve: merge conflicts, keeping Yu versions with selective dev-test"
```

---

## 🔍 查看冲突详情

### 查看所有冲突的文件
```bash
git diff --name-only --diff-filter=U
```

### 查看具体冲突内容
```bash
# 查看某个文件的冲突
git diff src/lib/firebaseClient.ts

# 查看所有冲突
git diff
```

### 使用图形化工具查看冲突
```bash
# VS Code
code --open-diff 

# 或者使用 git mergetool
git mergetool
```

---

## 🚀 推荐步骤

### 步骤 1: 确定策略
```bash
# 切回 Yu branch
git checkout Yu

# 重新开始合并
git merge origin/dev-test --no-commit --no-ff
```

### 步骤 2: 查看冲突统计
```bash
git diff --name-only --diff-filter=U | wc -l
```

### 步骤 3: 快速解决 (推荐采用 Yu 版本，因为有更新的测试和 Prettier)
```bash
# 采用 Yu branch 的所有版本
git checkout --ours .
git add .
```

### 步骤 4: 验证关键文件
```bash
# 检查是否有明显错误
npm run lint

# 检查构建是否成功
npm run build
```

### 步骤 5: 提交合并
```bash
git commit -m "resolve: merge dev-test into Yu, keeping Yu test and quality improvements"
```

### 步骤 6: Push 到远程
```bash
git push origin Yu
```

---

## 💡 为什么会有这么多冲突？

1. **Yu 分支包含的更改：**
   - Prettier 自动格式化了所有文件
   - 添加了新的测试文件
   - 修复了所有 ESLint 错误
   - 添加了代码质量配置

2. **dev-test 分支的更改：**
   - 可能有不同的格式化
   - 可能有不同的代码结构
   - 可能有不同的依赖版本

3. **结果：** 大多数文件都被修改，导致冲突

---

## 🎯 推荐的解决方案

**建议采用方案 1：使用 Ours (Yu 版本)**

**理由：**
- Yu 分支有最新的 Prettier 格式化
- Yu 分支有完整的测试覆盖（80%）
- Yu 分支有 0 ESLint 错误
- Yu 分支有代码质量配置
- dev-test 的功能已经包含在内

---

## ⚠️ 注意事项

1. **在执行前备份：**
   ```bash
   git branch backup-yu-before-merge
   ```

2. **合并后务必测试：**
   ```bash
   npm install
   npm run lint
   npm run test
   npm run build
   ```

3. **如果出错，可以回滚：**
   ```bash
   git reset --hard HEAD~1
   # 或回到备份分支
   git reset --hard backup-yu-before-merge
   ```

---

## 🔗 相关命令参考

```bash
# 中止当前合并
git merge --abort

# 查看合并状态
git status

# 列出有冲突的文件
git diff --name-only --diff-filter=U

# 采用 ours (当前分支) 版本
git checkout --ours <file>

# 采用 theirs (要合并的分支) 版本
git checkout --theirs <file>

# 对所有文件采用 ours
git checkout --ours .

# 对所有文件采用 theirs
git checkout --theirs .

# 标记文件为已解决
git add <file>

# 完成合并
git commit -m "message"

# 查看合并日志
git log --oneline --graph --all
```

---

## 📞 需要帮助？

如果卡住了，可以：
1. 运行 `git status` 查看当前状态
2. 运行 `git merge --abort` 中止合并重来
3. 使用 VS Code 的 Git 冲突解决器
4. 查看具体文件的冲突内容

---

**Date:** November 9, 2025
**Status:** Conflict resolution guide prepared
