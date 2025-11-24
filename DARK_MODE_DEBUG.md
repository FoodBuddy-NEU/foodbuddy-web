# Dark Mode 调试指南

## 问题分析
虽然代码中所有文本都设置为 `dark:text-white`，但页面上文字仍然是灰色。

## 可能的原因

### 1. 浏览器没有启用 dark 模式
打开浏览器开发者工具 (F12)，在Console输入：
```javascript
document.documentElement.classList.contains('dark')
```
如果返回 `false`，说明HTML元素上没有 `dark` 类。

### 2. Tailwind的dark模式配置问题
检查 `dark` 类是否被正确添加。在浏览器Console输入：
```javascript
// 查看HTML元素的类
document.documentElement.className

// 查看ThemeToggle按钮状态
localStorage.getItem('theme')
```

### 3. CSS优先级被覆盖
`globals.css` 中可能有更高优先级的CSS规则覆盖了Tailwind类。

检查元素的实际应用样式：
1. 右键点击灰色文字
2. 选择 "检查" (Inspect)
3. 查看 "Styles" 面板，看哪个CSS规则在生效

## 解决步骤

### 步骤 1: 手动切换 dark 模式
1. 打开 http://localhost:3000
2. 点击右上角的太阳/月亮图标切换主题
3. 确认HTML元素获得 `dark` 类

### 步骤 2: 强制刷新浏览器
按 **Ctrl+Shift+R** (Windows) 或 **Cmd+Shift+R** (Mac)

### 步骤 3: 清除浏览器缓存
1. 打开开发者工具 (F12)
2. 右键点击刷新按钮
3. 选择 "清空缓存并硬性重新加载"

### 步骤 4: 检查实际应用的CSS
在开发者工具中检查任意灰色文本元素，查看:
```
Computed > color: rgb(...)
```
应该是 `rgb(255, 255, 255)` (白色)

## 当前代码确认

所有文本在dark模式下都应该是白色：
- ✅ 地址/电话/距离: `dark:text-white`
- ✅ 餐厅信息: `dark:text-white`
- ✅ Deal时间: `dark:text-white`
- ✅ Reviews信息: `dark:text-white`
- ✅ 评分: `dark:text-white`
- ✅ 菜单价格: `dark:text-white`
- ✅ Choose a category: `dark:text-white`

## 如果还是不行

打开浏览器Console，运行这个脚本来强制应用dark模式并检查：
```javascript
// 强制添加 dark 类
document.documentElement.classList.add('dark');

// 检查所有文本元素的颜色
document.querySelectorAll('[class*="dark:text"]').forEach(el => {
  console.log(el.className, window.getComputedStyle(el).color);
});
```
