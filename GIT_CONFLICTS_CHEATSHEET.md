# Git Merge Conflicts - 命令速查表

## 🚨 检查冲突状态

```bash
# 查看所有冲突文件
git diff --name-only --diff-filter=U

# 查看冲突数量
git status

# 查看具体冲突内容
git diff
```

---

## 🛠️ 解决冲突的快速方法

### 方法 1: 采用当前分支版本 (推荐用于特定文件)

```bash
# 对所有文件采用当前分支版本
git checkout --ours .
git add .

# 对特定文件采用当前分支版本
git checkout --ours src/lib/firebaseClient.ts
git add src/lib/firebaseClient.ts
```

### 方法 2: 采用要合并分支的版本

```bash
# 对所有文件采用要合并的分支版本
git checkout --theirs .
git add .

# 对特定文件采用要合并的分支版本
git checkout --theirs src/lib/firebaseClient.ts
git add src/lib/firebaseClient.ts
```

### 方法 3: 手动解决 (最灵活)

```bash
# 编辑文件，手动解决冲突
vim src/lib/firebaseClient.ts

# 然后标记为已解决
git add src/lib/firebaseClient.ts
```

---

## 📋 完整流程

### 1. 开始合并

```bash
git merge origin/branch-name --no-commit --no-ff
```

### 2. 查看冲突

```bash
git diff --name-only --diff-filter=U
```

### 3. 解决冲突

```bash
# 采用 ours (当前分支)
git checkout --ours .
git add .
```

### 4. 完成合并

```bash
git commit -m "resolve: merge conflicts from branch-name"
```

### 5. Push 更改

```bash
git push origin your-branch-name
```

---

## ⚠️ 中止和回滚

### 中止当前合并

```bash
git merge --abort
```

### 回滚已完成的合并

```bash
# 回退一个提交
git reset --hard HEAD~1

# 或者回到之前的状态
git reflog
git reset --hard <commit-hash>
```

---

## 🔍 查看和对比

### 查看冲突文件

```bash
# 列出所有冲突文件
git diff --name-only --diff-filter=U

# 计算冲突文件数
git diff --name-only --diff-filter=U | wc -l
```

### 查看合并进度

```bash
# 查看当前合并状态
git status

# 查看合并日志
git log --oneline --graph --all
```

### 对比版本

```bash
# 查看 ours 版本 (当前分支)
git show :1:src/file.ts

# 查看 theirs 版本 (要合并的分支)
git show :3:src/file.ts
```

---

## 💾 保存和切换

### 创建备份分支

```bash
# 在解决前创建备份
git branch backup-before-merge
```

### 切换分支（中止合并）

```bash
# 中止当前合并
git merge --abort

# 或切换分支
git checkout another-branch
```

---

## 🎯 针对本项目的快速解决

### 为 Yu ← dev-test 解决冲突

```bash
# 1. 开始合并
git merge origin/dev-test --no-commit --no-ff

# 2. 采用 Yu 版本（推荐）
git checkout --ours .
git add .

# 3. 提交
git commit -m "resolve: merge dev-test into Yu, keeping Yu versions"

# 4. Push
git push origin Yu

# 5. 验证
npm run lint && npm run test
```

---

## 📚 常用模式

### 采用 ours 对所有文件

```bash
git checkout --ours .
git add .
git commit -m "resolve: keep our version"
```

### 采用 theirs 对所有文件

```bash
git checkout --theirs .
git add .
git commit -m "resolve: keep their version"
```

### 混合策略

```bash
# 基础采用 ours
git checkout --ours .

# 某些关键文件采用 theirs
git checkout --theirs src/lib/important.ts
git checkout --theirs src/app/critical.tsx

# 暂存所有更改
git add .

# 提交
git commit -m "resolve: merge with selective theirs"
```

---

## 🆘 遇到问题

### 冲突标记不清楚

```bash
# 使用图形工具
git mergetool

# 或在 VS Code 中：
code --open-diff .
```

### 想重来

```bash
# 中止当前合并
git merge --abort

# 创建新分支重新开始
git checkout -b retry-merge
git merge origin/dev-test --no-commit --no-ff
```

### 已经 push 了有冲突的代码

```bash
# 回退上一个提交
git reset --hard HEAD~1

# 强制 push（谨慎使用！）
git push origin your-branch --force
```

---

## ✨ Pro 技巧

### 查看原始版本

```bash
# 查看冲突前的原始版本
git show :0:src/file.ts
```

### 使用外部工具

```bash
# 配置 VS Code 作为 mergetool
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd 'code --wait --merge $REMOTE $LOCAL $BASE $MERGED'

# 然后运行
git mergetool
```

### 自动解决某些冲突

```bash
# 对特定文件类型自动采用 ours
git checkout --ours src/components/**/*.tsx
git add src/components/**/*.tsx
```

---

## 📊 性能提示

### 大量冲突时

```bash
# 一次性解决所有冲突
git checkout --ours . && git add . && git commit -m "resolve all conflicts"

# 分批处理
git add src/  # 先处理 src 目录
git add .github/  # 再处理其他
```

---

**Speed reference for resolving merge conflicts**  
**Last updated:** November 9, 2025
