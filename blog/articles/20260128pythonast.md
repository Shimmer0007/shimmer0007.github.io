# Python AST：当代码开始"整活"

## 前言

两段代码诠释什么叫脱裤子放屁。

## 第一段：正经的不正经

```python
import ast

print_call = ast.Call(
    func=ast.Name(id='print', ctx=ast.Load(), lineno=1, col_offset=0),
    args=[ast.Constant(value='Hello World', lineno=1, col_offset=6)],
    keywords=[],
    lineno=1,
    col_offset=0
)

expr = ast.Expr(value=print_call, lineno=1, col_offset=0)
module = ast.Module(body=[expr], type_ignores=[], lineno=1, col_offset=0)
compiled_code = compile(module, filename='<ast>', mode='exec')
exec(compiled_code)
```

### 评价

**15 行代码**，构建了完整的抽象语法树（AST），包括：

- 创建 `Call` 节点
- 创建 `Name` 节点表示 `print` 函数
- 创建 `Constant` 节点表示字符串
- 包装成 `Expr` 表达式
- 再包装成 `Module` 模块
- 最后 `compile` + `exec` 执行

为了输出一个 `Hello World`。


**正常人的写法：**

```python
print("Hello World")
```

---

## 第二段：混淆

```python
import ast, types

p = ''.join(chr(ord(c) + i - i) for i, c in enumerate("qsjoug", 112-112))
n = ast.Name(id=p, ctx=ast.Load())
c = ast.Constant(value="Hello World")
call = ast.Call(func=n, args=[c], keywords=[])
expr = ast.Expr(value=call)
mod = ast.Module(body=[expr])
code = compile(mod, "<地狱>", "exec")

types.FunctionType(code, globals())()
```

### 我的评价

让我们逐行分析：

#### 第一行

```python
p = ''.join(chr(ord(c) + i - i) for i, c in enumerate("qsjoug", 112-112))
```

- `enumerate("qsjoug", 112-112)` → `enumerate("qsjoug", 0)`
- `ord(c) + i - i` → `ord(c) + 0` → `ord(c)`
- `chr(ord(c))` → `c`

这一整行的作用就是：**把 `"qsjoug"` 变成 `"qsjoug"`**

等等，`"qsjoug"` 是什么？

- `q` → `p` (ASCII 码 -1)
- `s` → `r` (ASCII 码 -1)
- `j` → `i` (ASCII 码 -1)
- ...

哦！原来是 `"print"`……

**所以这一行的真实作用：**

```python
p = "print"
```

#### 后续的 AST

剩下的代码和第一段类似，只是：

- 用 `types.FunctionType` 包装了一层
- `compile` 的 filename 写成了 `"<地狱>"`

**最终效果：** 还是输出 `Hello World`

---

## 何意味？

### 1. AST 的强大

Python 的 `ast` 模块可以：

- 动态生成代码
- 分析代码结构
- 实现代码转换工具
- 构建 DSL（领域特定语言）

**实际应用场景：**

- 代码混淆器
- 静态分析工具
- 代码生成器
- Python 到其他语言的转译器

### 2. 代码混淆

第二段代码展示了基础的混淆技术：

- 字符串编码
- 无意义的数学运算
- 复杂的调用链

**实际应用：**

- 保护商业代码
- 防止逆向工程
- 恶意软件

### 3. 元编程

这两段代码都是元编程的例子——**用代码生成代码**。

**更实用的例子：**

```python
# 动态创建类
def create_class(name, methods):
    return type(name, (), methods)

MyClass = create_class('MyClass', {'greet': lambda self: 'Hello'})
obj = MyClass()
print(obj.greet())  # 输出: Hello
```

---

## 建议

遵循Zen of Python，请：

1. **保持简洁** - 能一行解决的别写十行
2. **注重可读性** - 代码是给人看的，不是给机器炫技的
3. **避免过度设计** - KISS 原则

---

## 结语

> **"Just because you can, doesn't mean you should."**