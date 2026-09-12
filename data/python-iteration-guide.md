# Python 의 순회(Iteration) 를 정확하게 공부하는 문서

> *Fluent Python 2/E · Chapter 17 — “Iterators, Generators, and Classic Coroutines”* 에서 다룬 핵심 주제 6 가지를 한국어 학습 노트로 정리한 문서.
> 모든 섹션은 **공식 Python 문서**, **PEP**, **CPython 소스** 를 참조하여 작성되었으며, *Fluent Python* 의 흐름을 따라가되 *Glossary*, *collections.abc*, *types.GeneratorType* 등 표준 용어를 정확히 사용한다.

---

## 이 문서의 구성

| # | 섹션 | 핵심 질문 | 페이지 |
| --- | --- | --- | --- |
| 1 | [`iter()` 함수](01-iter-function.md) | *시퀀스는 왜 iterable 인가?* `iter(callable, sentinel)` 은 어떻게 쓰는가? | 6.4k 단어 |
| 2 | [Iterable vs Iterator](02-iterables-vs-iterators.md) | *iterable* 과 *iterator* 의 정확한 구분은? iterable 이 자기 자신의 iterator 가 되면 안 되는 이유는? | 8.2k 단어 |
| 3 | [Classic Iterator → Generator Function → Generator Expression](03-classic-iterators-and-generators.md) | `Sentence` 를 다섯 가지 방식으로 구현하며 본 “*iterator → generator → genexpr*” 의 진화 | 11.2k 단어 |
| 4 | [Arithmetic Progression Generator + `itertools`](04-arithmetic-progression-and-itertools.md) | 산술 진행을 iterator 로 만들고, `itertools.count` + `takewhile` 로 한 줄로 압축하기 | 10.3k 단어 |
| 5 | [Iterable Reducing Functions](05-iterable-reducing-functions.md) | `sum`, `min`, `max`, `any`, `all`, `reduce` 와 `map`/`filter` 의 현대적 대체재 | 9.9k 단어 |
| 6 | [`yield from` 과 클래식 코루틴](06-yield-from-and-coroutines.md) | `chain` 재구현, 트리 순회, 코루틴 위임, `await` 로의 다리 | 10.3k 단어 |

각 섹션은 **20,000 자 이상** 으로 작성되었으며, *연습 문제* 와 *더 읽을 거리* 를 포함한다.

---

## 읽는 순서

1. **1) `iter()`** — *반복 프로토콜* 의 단일 진입점. 모든 iterable 의 시작.
2. **2) Iterable vs Iterator** — *컨테이너* 와 *손님* 의 구분. 이 구분이 뒤섞이면 무슨 일이 벌어지는가.
3. **3) Classic Iterator → Generator** — `Sentence` 라는 작은 사례로 *iterator* 인터페이스를 직접 구현하고, *제너레이터* 의 *syntax sugar* 로 단축하는 과정.
4. **4) Arithmetic Progression + `itertools`** — *iterator 빌딩 블록* 사고방식이 표준 라이브러리에 어떻게 녹아 있는가.
5. **5) Reducing Functions** — *iterator* 의 *단일 값* 환원. `sum`, `min`, `max`, `any`, `all` 그리고 *modern replacements* for `map`/`filter`/`reduce`.
6. **6) `yield from` + Coroutines** — *서브 제너레이터 위임*, *재귀적 트리 순회*, *클래식 코루틴* 그리고 *await* 로의 다리.

이 순서는 *Fluent Python 17 장* 의 본문 순서를 따른다. 다만 본문 5번 *Lazy Sentences* 는 본 문서의 3번 섹션에 통합했다.

---

## 핵심 개념 한눈에

### iterable / iterator / generator

```text
iterable          : __iter__ (필수)        — 여러 번 순회 가능한 컨테이너
    └── iterator  : __iter__ + __next__    — 한 번 순회하는 데이터 스트림
            └── generator : 위 + send/throw/close  — 양방향 통신 + 일시정지/재개
```

### iterator 프로토콜의 본질

```text
for x in obj:
    ...                       # 의미:
_iter = iter(obj)             # 1) iterator 를 얻음
while True:
    x = next(_iter)           # 2) 다음 항목을 요구
    if StopIteration: break   # 3) 종료 신호
    ...                       # 4) 본문
```

### `iter()` 의 두 형태

```text
iter(obj)                  # iterable → iterator
iter(callable, sentinel)   # callable + 종료 조건 → iterator
```

### `yield from` 의 본질

```text
yield from <iterable>      # 위임: 서브 iterable 의 값을 그대로 외부에 yield
                            # 투명 채널: send/throw/close 도 서브에 자동 위임
                            # return 값: 서브의 return 값을 result 로 받음
```

---

## 자주 헷갈리는 8 가지

1. **iterable ≠ iterator**. *iterable* 은 여러 번 순회 가능, *iterator* 는 한 번.
2. **`for` 루프는 `iter()` + `next()` 의 syntactic sugar**. *for* 자체에는 별도의 매직이 없다.
3. **`__iter__` 가 없는 객체도 iterable 일 수 있다.** 단, `__getitem__` 으로 시퀀스 시맨틱을 따라야 한다.
4. **`iter(callable, sentinel)` 의 sentinel 은 immutable 해야 한다.** `b''`, `''`, `0`, `None` 등이 일반적이다.
5. **iterator 는 일회용이다.** 두 번 순회하려면 `iter()` 로 새 iterator 를 만들거나, `list()` 로 materialize.
6. **제너레이터는 iterator 의 부분집합이다.** `gi_frame`, `send`/`throw`/`close` 는 *iterator* 가 아니라 *제너레이터* 의 확장.
7. **`yield from` 은 단순 wrapper 가 아니라 양방향 채널이다.** *return 값* 도 자동 전달된다.
8. **PEP 479 이후, 제너레이터 내부의 `StopIteration` 은 `RuntimeError` 로 변환된다.** *제너레이터* 안의 `StopIteration` 은 “*본문이 끝났다*” 라는 정상 신호로만 쓰여야 한다.

---

## 표준 라이브러리에서 *iterator* 를 돌려주는 함수들

* `os.walk` — 디렉토리 트리
* `pathlib.Path.glob`, `rglob`, `iterdir`
* `re.finditer` — 정규식 매치
* `csv.reader` — CSV 행
* `open()` 의 *file* 객체 — 라인
* `enumerate`, `zip`, `map`, `filter`, `reversed` (시퀀스 한정)
* `itertools` — `count`, `cycle`, `repeat`, `chain`, `islice`, `takewhile`, `dropwhile`, `filterfalse`, `compress`, `tee`, `groupby`, `accumulate`, `starmap`, `zip_longest`, `pairwise`, `product`, `permutations`, `combinations`, `combinations_with_replacement`
* `functools.reduce` — 임의의 누적 함수

이 함수들 대부분이 *iterator 빌딩 블록* 으로서 “*iterator 를 받아 iterator 를 반환*” 한다.

---

## *Fluent Python 2/E · Chapter 17* 의 목차와 본 문서의 매핑

| *Fluent Python 17 장 목차* | 본 문서 |
| --- | --- |
| Why Sequences Are Iterable: The iter Function | [섹션 1](01-iter-function.md) |
| Using iter with a Callable | [섹션 1](01-iter-function.md) |
| Iterables Versus Iterators | [섹션 2](02-iterables-vs-iterators.md) |
| Sentence Take #2: A Classic Iterator | [섹션 3](03-classic-iterators-and-generators.md) |
| Don’t Make the Iterable an Iterator for Itself | [섹션 2](02-iterables-vs-iterators.md) |
| Sentence Take #3: A Generator Function | [섹션 3](03-classic-iterators-and-generators.md) |
| How a Generator Works | [섹션 3](03-classic-iterators-and-generators.md) |
| Sentence Take #4: Lazy Generator | [섹션 3](03-classic-iterators-and-generators.md) |
| Sentence Take #5: Lazy Generator Expression | [섹션 3](03-classic-iterators-and-generators.md) |
| When to Use Generator Expressions | [섹션 3](03-classic-iterators-and-generators.md) |
| An Arithmetic Progression Generator | [섹션 4](04-arithmetic-progression-and-itertools.md) |
| Arithmetic Progression with itertools | [섹션 4](04-arithmetic-progression-and-itertools.md) |
| Generator Functions in the Standard Library | [섹션 4](04-arithmetic-progression-and-itertools.md) |
| Iterable Reducing Functions | [섹션 5](05-iterable-reducing-functions.md) |
| Subgenerators with yield from | [섹션 6](06-yield-from-and-coroutines.md) |
| Reinventing chain | [섹션 6](06-yield-from-and-coroutines.md) |
| Traversing a Tree | [섹션 6](06-yield-from-and-coroutines.md) |
| Classic Coroutines | [섹션 6](06-yield-from-and-coroutines.md) |

---

## 참고한 1차 자료

* **공식 Python 문서** ([docs.python.org/3](https://docs.python.org/3/))
  * [Built-in Functions — `iter()`, `next()`, `sum()`, `any()`, `all()`, `min()`, `max()`](https://docs.python.org/3/library/functions.html)
  * [Iterator Types](https://docs.python.org/3/library/stdtypes.html#iterator-types)
  * [`collections.abc`](https://docs.python.org/3/library/collections.abc.html)
  * [`typing` — `Iterable`, `Iterator`, `Generator`, `AsyncGenerator`](https://docs.python.org/3/library/typing.html)
  * [`itertools`](https://docs.python.org/3/library/itertools.html)
  * [`os.walk`](https://docs.python.org/3/library/os.html#os.walk)
  * [`re.finditer`](https://docs.python.org/3/library/re.html#re.finditer)
  * [`pathlib`](https://docs.python.org/3/library/pathlib.html)
  * [`asyncio`](https://docs.python.org/3/library/asyncio.html)
  * [`functools.reduce`](https://docs.python.org/3/library/functools.html#functools.reduce)
  * [`inspect.getgeneratorstate`](https://docs.python.org/3/library/inspect.html#inspect.getgeneratorstate)
  * [`types.GeneratorType`](https://docs.python.org/3/library/types.html#types.GeneratorType)
  * [Glossary — iterable, iterator, lazy](https://docs.python.org/3/glossary.html)
  * [Compound statements — `for`](https://docs.python.org/3/reference/compound_stmts.html#the-for-statement)
  * [Expressions — Yield expressions](https://docs.python.org/3/reference/expressions.html#yield-expressions)
* **PEP**
  * [PEP 234 – Iterators](https://peps.python.org/pep-0234/)
  * [PEP 255 – Simple Generators](https://peps.python.org/pep-0255/)
  * [PEP 289 – Generator Expressions](https://peps.python.org/pep-0289/)
  * [PEP 342 – Coroutines via Enhanced Generators](https://peps.python.org/pep-0342/)
  * [PEP 380 – Syntax for Delegating to a Subgenerator](https://peps.python.org/pep-0380/)
  * [PEP 479 – Change StopIteration handling inside generators](https://peps.python.org/pep-0479/)
  * [PEP 484 – Type Hints](https://peps.python.org/pep-0484/)
  * [PEP 492 – Coroutines with async and await syntax](https://peps.python.org/pep-0492/)
  * [PEP 525 – Asynchronous Generators](https://peps.python.org/pep-0525/)
  * [PEP 585 – Type Hinting Generics In Standard Collections](https://peps.python.org/pep-0585/)
* **CPython source** ([github.com/python/cpython](https://github.com/python/cpython))
  * `Objects/abstract.c` — `PyObject_GetIter`
  * `Objects/builtinobject.c` — `builtin_iter_impl`
* **기타 자료**
  * Fluent Python, 2nd Edition — Luciano Ramalho (O’Reilly, 2022)
  * [more-itertools](https://more-itertools.readthedocs.io/)
  * [Python Speed/Performance Tips](https://wiki.python.org/moin/PythonSpeed/PerformanceTips)

---

## 다 읽은 후의 자기 점검

다음 질문에 답할 수 있다면, 이 문서의 핵심을 충분히 흡수한 것이다.

1. `for x in obj:` 의 *바이트코드* 흐름을 설명하라. `GET_ITER` 와 `FOR_ITER` 가 각각 무엇을 하는지 적어라.
2. *iterable* 과 *iterator* 의 정의를 *Glossary* 의 표현으로 적어라. 왜 `iterator` 도 `isinstance(x, Iterable) == True` 인가?
3. *iterator* 의 `__iter__` 가 보통 `self` 를 반환해야 하는 이유를 *for 루프* 의 *동작* 과 연결해 설명하라.
4. `iter(callable, sentinel)` 의 *내부 동작* 을 *C 레벨* 의 *`callable_iter`* 와 연결해 설명하라.
5. `Sentence Take #2 → #3 → #4 → #5` 의 차이를 *코드 라인 수* / *클래스 수* / *게으름* 의 축으로 비교하라.
6. *iterable* 이 *iterator* 와 *sequence* 의 부분집합임을 `collections.abc` 의 계층으로 그려라.
7. *산술 진행* 을 네 가지 방식으로 구현하라. `itertools.count` + `takewhile` 의 *한 줄 표현* 까지.
8. *iterator 빌딩 블록* 을 “*무한 / 단축 종료 / 결합 / 슬라이싱 / 그룹화 / 누적 / 합성*” 의 카테고리로 분류하라.
9. `sum`, `min`, `max`, `any`, `all` 의 *iterator 친화성* 과 *단축 평가* 가 *iterator* 의 *게으름* 과 어떻게 결합되는지 설명하라.
10. `map` / `filter` / `reduce` 의 *현대적 대체재* 를 각각 제시하라. (`functools.reduce` 의 *initializer* 가 왜 중요한지 포함.)
11. `yield from <iter>` 의 *세 가지 의미* — *값의 위임*, *제어의 위임*, *return 값* — 를 설명하라.
12. *재귀 + yield from* 으로 *트리 깊이 우선 순회* 의 한 줄 코드를 작성하라.
13. *클래식 코루틴* `averager` 의 *yield/send* 의미, *첫 호출 규칙*, *return 값* 의 세 가지를 설명하라.
14. *PEP 479* 가 *제너레이터 내부의 `StopIteration`* 을 어떻게 다루는지 설명하라. *yield from 위임* 시의 *예외 흐름* 과 연결해 답하라.
15. *asyncio* 의 *await* 가 *yield from* 의 어떤 *의미* 를 계승하는지 적어라.

---

## 한 줄 최종 요약

> **“Python 의 *iteration* 은 `iter()` 와 `next()` 라는 두 함수 호출로 환원된다. `iter()` 는 *iterable* 로부터 *iterator* 를 얻고, `next()` 는 *iterator* 로부터 한 번에 한 항목을 얻는다. *제너레이터* 와 *제너레이터 표현식* 은 *iterator* 인터페이스를 *언어 차원의 syntax sugar* 로 만들어 주고, *yield from* 은 *서브 제너레이터* 와 *외부* 사이의 *투명한 양방향 채널* 을 만든다. *asyncio* 의 *await* 는 이 *투명성* 을 *비동기 세계* 로 옮긴 후손이다.”**

---

*문서 끝. — 2026.07.*
# 섹션 1. The `iter` Function — 시퀀스가 Iterable인 이유, 그리고 Callable과 함께 사용하기

> **Fluent Python 2/E · Chapter 17** 의 “Why Sequences Are Iterable: The iter Function”, “Using iter with a Callable” 에 대응하는 학습 노트.
> 참고: Python 3.12.x 기준 공식 문서 — [Built-in Functions: `iter()`](https://docs.python.org/3/library/functions.html#iter), [Iterator Types](https://docs.python.org/3/library/stdtypes.html#iterator-types), [collections.abc — Iterable, Iterator](https://docs.python.org/3/library/collections.abc.html), [PEP 234 – Iterators](https://peps.python.org/pep-0234/), [PEP 255 – Simple Generators](https://peps.python.org/pep-0255/), [Glossary: iterable, iterator](https://docs.python.org/3/glossary.html).

---

## 1.1 왜 “순회”를 처음에 정확히 이해해야 하는가

파이썬은 “iteration for all” 이라는 철학을 갖고 있다. `list`, `tuple`, `dict`, `set`, `str`, `bytes`, `bytearray`, `memoryview` 같은 내장 컬렉션은 물론, `range`, `zip`, `map`, `filter`, `enumerate`, `reversed`, `file object`, `os.walk` 의 결과, 데이터베이스 커서, 정규식 `Match` 객체, 제너레이터 함수, 제너레이터 표현식, 비동기 이터레이터에 이르기까지 — 거의 모든 “컨테이너성 객체” 가 **iterable(순회 가능)** 하다는 단 하나의 사실만으로 `for` 루프, 리스트/딕셔너리/셋 컴프리헨션, `unpacking`, `sum`, `any`, `all`, `max`, `min`, `sorted`, `tuple()`, `set()`, `list()` 같은 생성자, 그리고 `itertools` 의 모든 함수와 호환된다.

이 모든 가능성을 단단하게 받쳐주는 **유일한 접착제** 가 바로 내장 함수 `iter()` 다. 정확히 말하면, `iter()` 는 **파이썬의 반복 프로토콜(iteration protocol)** 을 사용자 코드와 라이브러리 코드 사이의 표준 인터페이스로 노출시켜 주는 단 한 줄짜리 어댑터다. 이 섹션의 목표는 “`for x in obj:` 가 도대체 무슨 일을 하는지” 를 언어 명세 수준에서 분해해서 설명하고, 동시에 실무에서 자주 쓰이는 **`iter(callable, sentinel)` 두 인자 형태** 까지 정확히 다루는 것이다.

이 장을 끝까지 읽으면 다음을 명확히 답할 수 있어야 한다.

* `for` 문이 내부적으로 호출하는 C 레벨 함수의 흐름이 어떻게 되는가.
* “모든 시퀀스는 iterable 이지만, 모든 iterable 이 시퀀스는 아니다” 라는 말이 정확히 무슨 뜻인가.
* `__iter__` 가 없는 객체도 iterable 처럼 동작하는 경우가 있는 이유는 무엇인가.
* `iter(callable, sentinel)` 형태로 어떤 종류의 “끝이 없는” 또는 “센티넬 종료” 패턴을 우아하게 처리할 수 있는가.

---

## 1.2 `iter()` 함수의 두 가지 시그니처

공식 문서에 따르면 `iter()` 는 두 가지 오버로드를 갖는다.

```text
iter(object)           # 1-인자 형태
iter(callable, sentinel) # 2-인자 형태
```

두 형태는 구현도 다르고, 사용하는 의도(intent)도 다르다. 먼저 1-인자 형태부터 보자.

### 1.2.1 1-인자 형태: `iter(object)`

가장 흔히 쓰이는 형태다. 객체 하나만 넘기면, 파이썬은 다음 순서로 동작한다 ([출처: CPython `Objects/abstract.c`, `PyObject_GetIter`](https://github.com/python/cpython/blob/main/Objects/abstract.c)).

1. 객체의 타입이 `__iter__` 를 구현했는지 확인한다. 구현되어 있다면 `__iter__()` 를 호출해 **iterator 객체** 를 얻는다.
2. `__iter__` 가 없으면, **legacy 프로토콜** 인 `__getitem__` 가 있는지 확인한다. 있다면 `obj[0]`, `obj[1]`, … 을 차례로 꺼내다가 **`IndexError` 가 발생** 하는 순간을 순회의 끝(`StopIteration`)으로 간주한다.
3. 둘 다 없으면 `TypeError: 'X' object is not iterable` 이 발생한다.

즉, 1-인자 `iter()` 의 본질은 **“iterable 로 만드는 것”** 이 아니라, **“iterable 로부터 iterator 를 얻는 것”** 이다. iterable 과 iterator 의 구분이 이미 1-인자 형태에 녹아 있다.

```python
>>> s = "ABC"
>>> it = iter(s)               # __iter__ 가 호출됨 → iterator 를 받음
>>> it
<str_iterator object at 0x7f...>
>>> next(it)                    # 'A'
>>> next(it)                    # 'B'
>>> next(it)                    # 'C'
>>> next(it)                    # StopIteration
```

`str` 은 분명 `__iter__` 를 구현하고 있으므로, 2번 분기(legacy)는 사용되지 않는다. 그렇다면 legacy 분기는 도대체 누구를 위해 살아남아 있을까?

### 1.2.2 Legacy 시퀀스 프로토콜 — `__getitem__` 만으로 iterable 인 것처럼 다루기

파이썬 2.1 시절, [PEP 234](https://peps.python.org/pep-0234/) 가 정식 iterator 프로토콜(`__iter__` + `__next__`)을 도입하기 전에는 “for 루프가 `seq[0], seq[1], …` 를 자동으로 인덱싱” 하는 방식이 사실상 표준이었다. PEP 234 이후에도 **하위 호환성** 을 위해 “`__iter__` 가 없지만 `__getitem__` 가 0 부터 시작하는 인덱스를 받는 객체” 는 iterable 로 간주된다. 이 때문에 다음과 같은 코드가 동작한다.

```python
class MySeqLike:
    """__iter__ 는 없지만 __getitem__ 만 있는 객체"""
    def __init__(self, data):
        self._data = list(data)
    def __getitem__(self, index):
        # IndexError 를 발생시키면 for 루프가 종료된다.
        return self._data[index]

ms = MySeqLike([10, 20, 30])
for x in ms:
    print(x)        # 10 20 30
```

이 코드는 명시적인 `__iter__` 도, `__next__` 도 정의하지 않았지만 `for` 루프가 동작한다. 이유는 간단하다. `for x in ms:` 는 내부적으로 `iter(ms)` 를 호출하고, `iter()` 는 `ms.__iter__()` 가 없음을 확인한 뒤, `ms.__getitem__(0)`, `ms.__getitem__(1)`, … 을 시도하다가 `IndexError` 가 발생하는 순간 순회를 종료한다.

이 legacy 경로가 “왜 시퀀스는 iterable 인가” 에 대한 정확한 답이다. **`list`, `tuple`, `str`, `bytes`, `bytearray` 같은 시퀀스 타입은 `__iter__` 를 명시적으로 구현** 하고 있으므로 당연히 iterable 이지만, **`__getitem__` 만 갖는 임의의 객체** 도 iterable 로 인정된다. 그래서 “iterable = `__iter__` 를 구현한 객체” 라고 단정하면 안 되고, **“`__iter__` 를 구현했거나, legacy 호환을 위해 `__getitem__` 을 0 부터 시작하는 인덱스로 구현한 객체”** 라고 정확히 적어야 한다.

이 사실이 중요한 이유 중 하나는, `collections.abc.Iterable` 의 `isinstance(obj, Iterable)` 검사가 **오직 `__iter__` 만 본다** 는 점이다. 따라서 `__getitem__` 만 가진 객체는 `isinstance(obj, Iterable) == False` 임에도 `for` 루프에서는 잘 돌아간다. 이 비대칭을 모르면 디버깅하다가 혼란에 빠진다.

```python
from collections.abc import Iterable
ms = MySeqLike([1, 2, 3])
isinstance(ms, Iterable)    # False   ← Iterable ABC 는 __iter__ 만 검사
for x in ms: ...             # OK     ← iter() 가 legacy 경로를 시도
```

`collections.abc.Iterable` 의 동작은 [공식 문서](https://docs.python.org/3/library/collections.abc.html#collections.abc.Iterable) 에도 그대로 명시돼 있다.

> “`Iterable` ABC 를 만족하는지의 여부는 `__iter__()` 메서드의 존재로 결정된다.”

따라서 `__iter__` 가 없으면 `Iterable` 의 인스턴스가 아니다. 다만 `for` 루프는 `iter()` 의 2-단계 fallback 덕분에 여전히 동작한다.

---

## 1.3 `iter()` 가 내부적으로 호출하는 표준 프로토콜

`for x in iterable:` 의 정확한 의미는 [Python 언어 명세](https://docs.python.org/3/reference/compound_stmts.html#the-for-statement) 와 `Objects/abstract.c` 의 `PyObject_GetIter` 가 함께 정의한다. 의사 코드로 표현하면 다음과 같다.

```text
_iter = iter(iterable)                # 1단계: iterator 를 얻음
while True:
    try:
        x = next(_iter)               # 2단계: 다음 항목을 요구
    except StopIteration:             # 3단계: 종료 신호
        break
    # 본문 실행
```

여기서 두 가지가 모두 표준 프로토콜이다.

* `iter(iterable)` 은 `iterable.__iter__()` 를 호출한다.
* `next(_iter)` 는 `_iter.__next__()` 를 호출한다.

이 두 메서드는 각각 `collections.abc.Iterable.__iter__` 와 `collections.abc.Iterator.__next__` 의 abstract 메서드다. 이게 전부다. `for` 루프에 특화된 문법은 따로 없고, 단지 위 두 메서드를 호출하는 syntactic sugar 일 뿐이다.

따라서 `__iter__` 와 `__next__` 만 정확히 구현하면 어떤 객체든 `for` 루프에 넣을 수 있다. `__iter__` 는 “새로운 iterator 를 반환” 해야 하고, `__next__` 는 “다음 항목을 반환하거나 `StopIteration` 을 일으킨다.” 여기서 `StopIteration` 은 `BaseException` 의 직계 서브클래스이지만, 일반적인 `except` 로 잡으면 안 된다. ([PEP 479](https://peps.python.org/pep-0479/) 이후 제너레이터 안에서 `StopIteration` 이 leak 되지 않도록 보장하는 규칙이 생겼다 — 다음 섹션에서 자세히 다룬다.)

### 1.3.1 `StopIteration` 의 정확한 위치

`StopIteration` 은 사실 두 가지 의미로 쓰인다.

1. **iterator 의 종료 신호** — `__next__` 가 일으키면 `for` 루프가 자동으로 멈춘다.
2. **for 루프 외부의 예외** — 사용자가 직접 `next(it)` 를 호출하다 보면 `StopIteration` 이 그대로 propagate 된다. 이 경우 `try/except StopIteration` 으로 잡을 수 있다.

예를 들어:

```python
it = iter([1, 2])
while True:
    try:
        x = next(it)
    except StopIteration:
        break
    print(x)
```

이 패턴은 “수동으로 `for` 를 흉내내는” 전형적인 코드다. 보통 `for` 루프를 쓰는 편이 깔끔하지만, iterator 의 상태 머신을 자세히 보여줄 때 이렇게 풀어 적기도 한다.

---

## 1.4 iterable 과 iterator 의 구분이 왜 중요한가

`iter()` 가 1-인자일 때의 진짜 의미는 **“iterable → iterator 변환”** 이다. 즉 `iter()` 는 *iterable* 을 인자로 받아 *iterator* 를 *반환* 한다. 둘은 다른 종류다.

* **iterable** : `__iter__` 를 갖는 객체. **여러 번 순회** 할 수 있다. (예: `list`, `tuple`, `set`, `dict`, `str`, 사용자 정의 컨테이너 …)
* **iterator** : `__next__` 를 갖는 객체. **한 번에 한 항목씩만** yield 한다. **단 한 번만** 순회할 수 있다. (예: `list_iterator`, `map 객체`, `zip 객체`, `enumerate 객체`, `filter 객체`, `reversed 객체`, `file 객체`, 제너레이터 …)

이 구분이 직관적으로 와닿지 않으면, 다음 코드를 보자.

```python
nums = [1, 2, 3]
it1 = iter(nums)
it2 = iter(nums)
next(it1)   # 1
next(it1)   # 2
next(it2)   # 1   ← it1 과 it2 는 독립적이다.
```

같은 iterable `nums` 에서 두 개의 iterator 가 만들어졌고, 두 iterator 는 서로의 진행 상태에 영향을 주지 않는다. `nums` 자체는 그대로다. 반면 다음 코드는 다르다.

```python
it = iter([1, 2, 3])
list(it)        # [1, 2, 3]
list(it)        # []   ← 두 번째 호출은 비어 있다!
```

iterator 는 **일회용** 이다. 한 번 모두 소비하면 다시 안 채워진다. 그래서 `for x in iterator:` 를 두 번 돌리면 두 번째 루프는 본문 자체가 실행되지 않는다.

### 1.4.1 iterable 이 자기 자신의 iterator 인 경우의 위험

어떤 객체가 `__iter__` 와 `__next__` 를 둘 다 자기 자신에게 정의해서, 자기 자신을 iterator 처럼 사용하게 만들 수도 있다. 예를 들어:

```python
class OneShot:
    def __iter__(self): return self
    def __next__(self):
        if not hasattr(self, "done"):
            self.done = False
        if self.done:
            raise StopIteration
        self.done = True
        return "boom"

x = OneShot()
for v in x: print(v)   # boom
for v in x: print(v)   # (출력 없음 — 이미 소진됨)
```

이 패턴이 “동작은 하지만” 위험한 이유는, `iter(x)` 를 두 번 호출해도 같은 객체가 반환되므로 두 번째 `for` 루프가 자동으로 끝나버린다는 것이다. 사용자는 “같은 객체를 다시 순회했으니 같은 결과가 나올 것” 이라고 기대하기 쉽다. Fluent Python 17 장은 이를 **“Don’t Make the Iterable an Iterator for Itself”** 라는 짧은 섹션에서 명시적으로 금지한다. iterable 은 “여러 번 순회 가능한 컨테이너” 의 의미론을 갖는 반면, iterator 는 “한 번 순회하는 핸들” 이라서, 두 인터페이스를 한 객체에 합치면 의미가 깨진다.

이 주제는 **섹션 2** 에서 더 자세히 다룬다.

---

## 1.5 “iterable vs iterator vs generator” 의 한눈에 보는 표

| 종류 | 핵심 메서드 | 순회 가능 횟수 | 상태 보유 | 예 |
| --- | --- | --- | --- | --- |
| iterable | `__iter__` | 무한 (컨테이너 한정) | 무 | `list`, `tuple`, `dict`, `set`, `str`, `range`, 사용자 컬렉션 |
| iterator | `__iter__`, `__next__` | 1 회 | 위치 정보(보통 인덱스 또는 내부 포인터) | `list_iterator`, `enumerate`, `zip`, `map`, `filter`, `reversed`, `file` |
| generator | `__iter__`, `__next__`, `send`, `throw`, `close` | 1 회 | `yield` 까지의 suspended frame | 모든 제너레이터 함수 / 제너레이터 표현식 결과 |
| async iterable | `__aiter__` | 무한 (논리적 의미에서) | 무 | `async with` 내부에서 |
| async iterator | `__aiter__`, `__anext__` | 1 회 | 비동기 진행 | async generator |

여기서 generator 는 iterator 의 일종이라는 점을 기억해 두자. generator 는 자동으로 `__iter__` 와 `__next__` 를 제공하므로, 사실상 “제너레이터 함수 또는 제너레이터 표현식” 은 `iter()` 의 두 번째 인자(`__next__` 가 있는 객체)조건을 그대로 만족한다.

---

## 1.6 2-인자 형태: `iter(callable, sentinel)`

1-인자 형태가 “iterable → iterator” 였다면, 2-인자 형태는 의미가 완전히 다르다. **2-인자 형태는 “iterable 이 없는” callable 로부터 iterator 를 만들어낸다.** 공식 문서 표현을 그대로 옮기면:

> “`iter(callable, sentinel)` 형태로 호출되면, 매 항목이 `callable()` 을 호출한 결과이고, 반환값이 `sentinel` 과 같은 순간 순회가 종료된다.”

즉, 종료 조건이 `sentinel` 값이다. iterable 이 “끝” 이라는 정보를 갖고 있어야 했던 1-인자 형태와 달리, 2-인자 형태에서는 **“언제 끝날지” 를 sentinel 이 결정** 한다. callable 은 “다음 데이터를 가져오는 절차” 일 뿐, 그 절차가 sentinel 을 돌려주는 순간 `StopIteration` 이 자동으로 발생한다.

### 1.6.1 1-인자 형태와의 결정적 차이

| 항목 | `iter(obj)` | `iter(callable, sentinel)` |
| --- | --- | --- |
| 첫 인자 | iterable (컨테이너성 객체) | 인자 없는 callable |
| 종료 조건 | `__next__` 가 `StopIteration` 을 일으킬 때 | `callable()` 의 반환값이 `sentinel` 일 때 |
| 내부 동작 | `iterable.__iter__()` | 내부에 `callable` 을 호출하는 작은 iterator 클래스를 만들어 사용 |
| 시작 지점 | 시작 위치는 iterator 가 알고 있음 | 시작 위치는 callable 의 상태가 결정 |

2-인자 형태는 사실 CPython 내부에서 작은 wrapper 클래스를 생성해 1-인자 형태로 합치는 것 이상의 일을 한다. 종료 검사가 `==` 비교로 자동화되기 때문에, callable 안에서 예외 처리를 직접 하지 않아도 된다.

```python
# 1-인자 형태: iterator 가 StopIteration 을 발생시켜야 함
def read_block(f, size):
    data = f.read(size)
    if not data:
        raise StopIteration
    return data

# 2-인자 형태: 빈 바이트열(b'')이 sentinel
from functools import partial
with open('data.bin', 'rb') as f:
    for block in iter(partial(f.read, 16), b''):
        process(block)
```

위 코드에서 `partial(f.read, 16)` 은 “16 바이트를 읽되 인자 없이 호출 가능한” callable 이다. `iter(callable, b'')` 는 이 callable 을 반복적으로 호출하다가 `b''` 가 돌아오는 순간 멈춘다. 파일이 EOF 에 도달하면 `f.read(16)` 이 빈 바이트열을 돌려주므로, 그것이 sentinel 로 인식되어 순회가 종료된다.

### 1.6.2 `iter(callable, sentinel)` 의 전형적인 사용 패턴

2-인자 형태는 “어떤 동작을 sentinel 이 나올 때까지 반복” 하고 싶을 때 매우 깔끔하다. 자주 보이는 패턴을 정리한다.

#### (1) EOF 까지 청크 단위로 파일 읽기

위에서 본 예시. 텍스트 모드에서도 동일하게 동작한다 (`sentinel = ''`).

```python
with open('big.log', 'r', encoding='utf-8') as f:
    for line in iter(f.readline, ''):
        # f.readline 은 '' 을 EOF 의 sentinel 로 돌려준다
        process(line)
```

사실 `for line in f:` 와 동등하지만, 명시적으로 “EOF 까지” 라는 종료 조건을 코드에 드러내고 싶을 때 `iter(f.readline, '')` 가 더 자기-문서적(self-documenting)이다. [공식 `io` 문서](https://docs.python.org/3/library/io.html#io.IOBase.readline) 에서도 `readline` 의 종료 동작을 그렇게 설명한다.

#### (2) 사용자 입력에서 “빈 줄이 나올 때까지” 읽기

```python
print("Enter values, blank line to finish:")
for raw in iter(input, ''):
    value = float(raw)
    values.append(value)
```

`input` 은 인자 없는 callable 이고, 빈 문자열이 sentinel 이다. 사용자가 빈 줄을 입력하는 순간 순회가 끝난다. 이 패턴은 REPL, 설정 파일 파서, 간단한 DSL 등을 만들 때 자주 사용된다.

#### (3) `random` 시퀀스를 sentinel 로 자르기

```python
import random
def roll_d6(): return random.randint(1, 6)
# 6 이 나올 때까지 주사위를 굴린다.
for roll in iter(roll_d6, 6):
    print(roll)
```

확률적 종료가 필요한 경우에 매우 유용하다. callable 이 자기 자신이 종료 신호를 만들어내는 셈이다.

#### (4) 블록 단위 네트워크 읽기

```python
from functools import partial
import socket

sock = socket.create_connection(('example.com', 80))
# recv 가 b'' 를 돌려줄 때까지(=상대가 연결을 닫을 때까지) 읽기
buf = b''
for chunk in iter(partial(sock.recv, 4096), b''):
    buf += chunk
```

### 1.6.3 `iter(callable, sentinel)` 의 미묘한 함정

2-인자 형태는 강력하지만, **callable 이 sentinel 을 영영 돌려주지 않는 경우 무한 루프** 가 된다. 이는 결함이 아니라 의도된 동작이다. 따라서 다음 규칙을 항상 자각하고 있어야 한다.

* `callable` 은 언젠가 `sentinel` 을 돌려주어야 한다.
* `callable` 이 예외를 일으키면 순회는 그대로 중단된다 (그 예외가 propagate 된다).
* `sentinel` 은 **반드시 immutable** 한 값(보통 `None`, `b''`, `''`, `0`, `False`, `(-1)` 등)이어야 한다. mutable 값을 sentinel 로 쓰면 비교가 모호해질 수 있다.
* `callable` 은 **인자가 없어야 한다** (호출 시 인자가 넘어가지 않기 때문). `partial`, 람다, `operator.itemgetter`(인자 없는 경우), `operator.attrgetter`(인자 없는 경우) 등을 사용해 wrapping 한다.

예를 들어, 다음과 같은 코드는 `TypeError` 를 일으킨다.

```python
for x in iter(int, 'stop'):   # int() 는 인자가 없으면 0 을 돌려주므로 sentinel 매칭이 안 됨
    pass
```

`int` 는 인자 없이 호출 가능하긴 하지만, `sentinel='stop'` 과 영영 일치하지 않으므로 영원히 `0, 1, 2, 3, …` 이 된다. 반면 다음은 의도대로 종료된다.

```python
for x in iter(int, 0):         # int() 가 0 을 반환하는 순간 종료
    pass                       # 본문은 한 번도 실행되지 않음
```

### 1.6.4 2-인자 형태의 내부 구현 이해

CPython 의 `builtin_iter_impl` ([Objects/builtinobject.c](https://github.com/python/cpython/blob/main/Objects/builtinobject.c)) 은 2-인자 형태로 호출될 때 `callable_iter` 객체를 생성한다. 그 객체의 `__next__` 는 다음과 같은 의사 코드와 같다.

```text
def __next__(self):
    value = self._callable()        # 인자 없이 호출
    if value == self._sentinel:
        raise StopIteration
    return value
```

`==` 비교는 `PyObject_RichCompareBool` 로 수행된다. 따라서 두 객체가 `__eq__` 로 같다고 판단되면, 그 비교는 truthy 로 평가돼 `StopIteration` 이 발생한다. 그래서 사용자 정의 객체도 sentinel 이 될 수 있다 (단, `__hash__` 와 `__eq__` 가 일관되어야 한다).

---

## 1.7 “시퀀스는 왜 iterable 인가” 에 대한 정확한 답

이제 다시 처음의 질문으로 돌아오자. “왜 시퀀스는 iterable 인가?” 에 대한 정답은 두 가지 사실의 결합이다.

1. **CPython 의 내장 시퀀스 타입(`list`, `tuple`, `str`, `bytes`, `bytearray`, `memoryview`, `range`)은 모두 `__iter__` 메서드를 구현** 하고 있다. 이 메서드는 “새로운 iterator” 를 반환한다. 따라서 `iter(seq)` 가 정확히 한 단계로 iterator 를 만들 수 있다.
2. **`iter()` 의 fallback** 으로 `__getitem__` 만 가진 객체도 iterable 로 인정된다. **시퀀스 프로토콜** 이 0-based 인덱싱을 요구하기 때문에, 이 fallback 은 사실상 “0, 1, 2, …” 를 시도하다가 `IndexError` 가 나면 끝내는 시퀀스-유사 객체까지 iterable 의 범위에 끌어들인다.

이 두 가지가 합쳐져서 “모든 시퀀스는 iterable 이다” 라는 파이썬의 기본 약속이 성립한다. 그리고 그 약속은 [Glossary: iterable](https://docs.python.org/3/glossary.html#term-iterable) 에서 다음과 같이 표현된다.

> “iterable: An object capable of returning its members one at a time. Examples of iterables include all sequence types (such as `list`, `str`, `tuple`) and some non-sequence types like `dict`, `file objects`, and objects of any classes you define with an `__iter__()` method or with a `__getitem__()` method that implements Sequence semantics.”

여기서 “Sequence semantics” 라는 표현이 핵심이다. 즉 `__getitem__` 만으로 iterable 처럼 인정받으려면 그 메서드가 “0-based 인덱스 + 범위 밖에서 `IndexError`” 라는 시퀀스 시맨틱을 따라야 한다.

---

## 1.8 “Duck Typing” 으로 보는 iterable

파이썬은 정식 인터페이스 선언(`implements Iterable`) 없이도 객체가 iterable 처럼 동작하면 그 객체를 iterable 로 받아들인다. 이를 흔히 **duck typing** 이라 부른다. 파이썬에서 “오리처럼 걷고 오리처럼 꽥꽥거리면 오리다.” 라는 문장이 정확히 의미하는 것이, “`__iter__` 가 있거나 `__getitem__` 으로 시퀀스 시맨틱을 구현했다면 iterable 이다.” 다.

이 덕분에 `for` 루프는 매우 관대하다. 사용자 코드는 *어떤 타입인지* 검사할 필요 없이, 단지 *iterable 처럼 쓸 수 있는지* 만 신경 쓰면 된다. 이 관용은 다음과 같은 코드 한 줄에 잘 드러난다.

```python
total = sum(obj)        # obj 는 어떤 iterable 이든 된다
for x in obj: ...       # 역시 마찬가지
```

다만 너무 duck typing 만 의존하면, **나중에 클래스가 메서드를 하나라도 빠뜨리면 런타임에야 알 수 있다** 는 약점이 있다. 이를 보완하기 위해 `collections.abc.Iterable` 을 `isinstance` 검사에 쓰거나, 정적 타입 검사 단계에서 [`typing.Iterable[T]`](https://docs.python.org/3/library/typing.html#typing.Iterable) 같은 제네릭을 쓰는 방법이 있다. ([PEP 484 – Type Hints](https://peps.python.org/pep-0484/), [PEP 585 – Type Hinting Generics In Standard Collections](https://peps.python.org/pep-0585/) 참고.)

### 1.8.1 `isinstance` 와 `Iterable` 의 비대칭

`isinstance(x, collections.abc.Iterable)` 의 결과는 “x 가 `__iter__` 를 구현했는가” 와 동치다. `__getitem__` 만 있는 객체는 `False` 이다. 반면 `for x in obj:` 는 `iter(obj)` 의 fallback 덕분에 `__getitem__` 객체도 받아들인다. 이 비대칭 때문에, **`isinstance` 검사는 “`for` 가 받아주는 객체의 상위 집합” 이라고 보면 안 되고, “`__iter__` 를 가진 객체의 부분집합”** 으로 이해해야 한다.

이 사실은 Fluent Python 17 장 본문에서 명확히 경고한다. “A common mistake is to assume that all iterables are iterators, or that all iterables support `isinstance(x, collections.abc.Iterable)` while only providing `__getitem__`.” 라는 취지다.

---

## 1.9 내부 동작 한 단계 더 들어가기: C 레벨의 `PyObject_GetIter`

`iter(obj)` 의 C 구현은 `PyObject_GetIter` 다. 의사 코드:

```c
PyObject *
PyObject_GetIter(PyObject *o)
{
    PyTypeObject *t = Py_TYPE(o);
    /* 1) __iter__ 가 있으면 호출 */
    getiterfunc f = t->tp_iter;
    if (f != NULL) {
        res = (*f)(o);
        if (res != NULL) {
            /* 2) __iter__ 가 반환한 객체는 반드시 __next__ 를 가져야 함 */
            if (!PyIter_Check(res)) {
                Py_DECREF(res);
                PyErr_Format(PyExc_TypeError,
                    "iter() returned non-iterator of type '%.100s'",
                    Py_TYPE(res)->tp_name);
                return NULL;
            }
            return res;
        }
        ...
    }
    /* 3) __iter__ 가 없으면 __getitem__ 으로 폴백 (legacy) */
    if (t->tp_as_sequence != NULL && t->tp_as_sequence->sq_item != NULL) {
        return PySeqIter_New(o);
    }
    PyErr_Format(PyExc_TypeError,
                 "'%.100s' object is not iterable",
                 t->tp_name);
    return NULL;
}
```

세 가지 사실이 중요하다.

* **`__iter__` 가 있는 경우, 그 반환 객체는 반드시 `__next__` 가 있는 iterator 여야 한다.** 만약 `__iter__` 가 자기 자신을 반환했는데 그 객체가 `__next__` 를 구현하지 않았다면 위 코드에서 `TypeError` 가 발생한다. 따라서 “iterable 인데 iterator 는 아닌 객체” 가 `__iter__` 의 반환값이 될 수 없다.
* `__iter__` 가 없으면 시퀀스 프로토콜(`tp_as_sequence->sq_item`)이 있는지 보고, 있으면 `PySeqIter_New(o)` 로 wrapping 한다. `PySeqIter_New` 은 내부적으로 `0, 1, 2, …` 를 인덱스로 시도하다가 `__getitem__` 의 결과가 `NULL` (즉 `IndexError`)이 되면 `StopIteration` 을 일으키는 iterator 를 만든다.
* 둘 다 없으면 `TypeError` 가 발생한다. 이 에러 메시지가 바로 “`'X' object is not iterable'” 다.

이 C 구현을 이해하면 “`__iter__` 가 없는 객체도 iterable 인가?” 라는 질문의 답이 명확해진다. **for 루프 관점에서는 Yes, `collections.abc.Iterable` 관점에서는 No.** 이 차이가 “iterable 시맨틱” 과 “Iterable ABC” 의 의미 차이를 드러낸다.

---

## 1.10 한 걸음 더: 1-인자 `iter()` 의 반환값에 `iter()` 를 다시 적용해도 안전하다

`iter(iterator)` 를 호출하면 어떻게 될까? iterator 는 `__iter__` 를 구현하고 있고, 그 `__iter__` 는 *대부분* `self` 를 반환한다 ([공식 문서](https://docs.python.org/3/library/stdtypes.html#iterator-types) 의 “Iterators” 단락 참조). 따라서 다음은 안전하다.

```python
it = iter([1, 2, 3])
iter(it) is it        # True
```

즉 iterator 에 `iter()` 를 다시 적용해도 같은 iterator 가 나온다. 이 사실은 `for` 루프가 *iterable* 과 *iterator* 를 모두 받아주는 이유이기도 하다. `for` 가 내부적으로 `iter()` 를 호출하기 때문이다.

다만 **제너레이터는 iterator 이지만 `__iter__` 가 자기 자신을 반환한다** 는 일반 규칙을 따른다. 따라서 `iter(gen)` 은 `gen` 자신을 돌려준다.

---

## 1.11 `iter()` 와 “unpacking” 의 관계

`*` 언패킹, `for` 루프, `in` 검사, 컴프리헨션 등 **모든 iterable-기반 구문** 은 결국 `iter()` 와 `next()` 의 syntactic sugar 다. 다음 네 가지 예를 비교해 보자.

```python
data = [1, 2, 3]

# 1) for 루프
for x in data: print(x)

# 2) 수동 iterator 프로토콜
it = iter(data)
while True:
    try: x = next(it)
    except StopIteration: break
    print(x)

# 3) 언패킹
a, b, c = data      # 정확히 3개가 나와야 함, 아니면 ValueError

# 4) 컴프리헨션
[y for y in data]   # [1, 2, 3]
```

이 중 1)과 2)는 완전히 등가다. 3)은 내부적으로 `iter(data)` 를 호출하고 `next()` 로 값을 채운다. 4)도 동일한 iterator 프로토콜을 따른다. 즉 **iterable 의 “정통한” 사용은 단 하나, `iter()` 와 `next()` 다.** 나머지는 모두 그 위에 얹힌 표기법이다.

### 1.11.1 `for` 가 `iter` 호출에 실패하면?

`for x in obj:` 문은 컴파일 단계에서 bytecode `GET_ITER` + `FOR_ITER` 로 변환된다. `FOR_ITER` 는 “iterator 의 `__next__` 를 호출해 `StopIteration` 이 발생할 때까지 본문을 실행” 한다. 만약 `obj` 가 iterable 이 아니면 `GET_ITER` 가 `TypeError: 'X' object is not iterable` 을 일으킨다. 이 에러는 `iter()` 가 직접 일으키는 에러와 동일하다.

### 1.11.2 `in` 연산자

`x in iterable` 도 내부적으로 `iter(iterable)` 와 `next()` 를 사용한다. 다만 단축 평가(short-circuit)로 “찾는 값” 이 나오면 즉시 `True` 를 반환한다.

```python
10 in [1, 2, 3, 4, 10]   # True
10 in (i for i in range(20) if i % 3 == 0)  # 0, 3, 6, 9, 12, 15, 18, 21, 24 → True
```

`in` 이 사소해 보이지만, 이 또한 iterator 프로토콜을 따른다는 사실은 iterable 의 의미를 통일적으로 이해하는 데 도움이 된다.

---

## 1.12 흔한 오해 정리

마지막으로, 이 섹션을 읽으면서 절대 잊어서는 안 되는 **다섯 가지 사실** 을 정리한다.

1. **`iter()` 는 iterable → iterator 변환기** 다. iterator 를 다시 iterator 로 만들 수도 있지만, 보통은 “iterable 에서 출발해 iterator 로 가는” 함수로 기억하면 된다.
2. **iterable 은 여러 번 순회할 수 있지만, iterator 는 한 번뿐** 이다. 두 개념을 같은 객체에 섞으면 안 된다.
3. **`__iter__` 가 없는 객체도 iterable 일 수 있다.** 단, `__getitem__` 이 0-based 인덱싱을 따라야 한다. `collections.abc.Iterable` 의 `isinstance` 검사는 `__iter__` 만 본다.
4. **`iter(callable, sentinel)` 는 EOF 처리, 입력 수집, 확률적 종료** 같은 패턴에 매우 적합하다. 단, sentinel 은 immutable 해야 하고, callable 은 인자가 없어야 한다.
5. **`for` 루프는 단순한 문법이 아니라, `iter()` + `next()` 의 syntactic sugar 다.** 모든 iterable-관련 코드는 결국 이 두 함수 호출에 수렴한다.

---

## 1.13 연습 문제

다음 문제들은 본문에서 다룬 내용을 코드로 직접 확인해 보는 단계다.

1. **다섯 가지 객체의 iterator 동작 비교**: `range(3)`, `[1, 2, 3]`, `(1, 2, 3)`, `{1, 2, 3}`, `{'a': 1}` 각각에 `iter()` 를 적용하고, `next()` 를 두 번 호출해 보고, `list()` 로 한 번에 소비해 보라. 그 다음 `iter()` 를 두 번 적용하면 어떻게 되는지 확인해 보라.

2. **`__iter__` 없는 iterable 만들기**: `__getitem__` 만 가진 클래스 `OnlyGetItem` 을 정의하고, `for` 루프와 `isinstance(obj, Iterable)` 의 결과가 어떻게 갈리는지 직접 확인해 보라.

3. **EOF 까지 8 바이트씩 읽기**: 임시 파일을 만들고 `iter(lambda f: f.read(8), b'')` 와 `iter(partial(f.read, 8), b'')` 두 방법이 같은 결과를 주는지 확인해 보라. `lambda` 와 `partial` 의 차이도 적어 보라.

4. **시작과 끝이 없는 데이터**: 사용자가 “quit” 을 입력할 때까지 한 줄씩 입력받아 정수로 변환해 리스트에 저장하는 코드를 `iter(input, 'quit')` 로 작성해 보라.

5. **시퀀스 프로토콜의 종결 신호**: `__getitem__` 안에서 `IndexError` 대신 `KeyError` 를 일으키면 어떻게 되는지 실험해 보라. (힌트: `IndexError` 가 아니라 다른 예외가 발생하면 `iter()` 의 fallback 이 그것을 그대로 propagate 한다.)

---

## 1.14 더 읽을 거리

* [Fluent Python, 2nd Edition – 17. Iterators, Generators, and Classic Coroutines](https://www.fluentpython.com/)
* [Python 3.12 Reference – Compound statements: `for`](https://docs.python.org/3/reference/compound_stmts.html#the-for-statement)
* [Python 3.12 Standard Library – Built-in Functions: `iter()`](https://docs.python.org/3/library/functions.html#iter)
* [Python 3.12 Standard Library – Iterator Types](https://docs.python.org/3/library/stdtypes.html#iterator-types)
* [Python 3.12 Standard Library – `collections.abc`](https://docs.python.org/3/library/collections.abc.html)
* [Python 3.12 Glossary – iterable, iterator](https://docs.python.org/3/glossary.html)
* [PEP 234 – Iterators](https://peps.python.org/pep-0234/)
* [PEP 255 – Simple Generators](https://peps.python.org/pep-0255/)
* [PEP 479 – Change StopIteration handling inside generators](https://peps.python.org/pep-0479/)
* [PEP 484 – Type Hints](https://peps.python.org/pep-0484/)
* [PEP 585 – Type Hinting Generics In Standard Collections](https://peps.python.org/pep-0585/)
* CPython source: [`Objects/abstract.c` – `PyObject_GetIter`](https://github.com/python/cpython/blob/main/Objects/abstract.c), [`Objects/builtinobject.c` – `builtin_iter_impl`](https://github.com/python/cpython/blob/main/Objects/builtinobject.c)

---

### 정리

이번 섹션에서 다룬 핵심을 한 문장으로 요약하면 다음과 같다.

> **`iter()` 는 iterable 로부터 iterator 를 얻는 표준 어댑터이며, iterable 시맨틱은 `__iter__` 와 legacy `__getitem__` 두 경로로 정의된다. 두 번째 인자 `sentinel` 을 더하면 iterable 이 없는 callable 로부터도 “값이 sentinel 일 때까지” 라는 종료 조건을 갖는 iterator 를 만들 수 있다.**

다음 섹션에서는 이 iterable/iterator 구분이 왜 그렇게 중요한지를, **“iterable 이 자기 자신의 iterator 가 되어서는 안 되는 이유”** 를 중심으로 살펴본다.
# 섹션 2. Iterables Versus Iterators — Iterable 이 자기 자신의 Iterator 가 되어서는 안 되는 이유

> **Fluent Python 2/E · Chapter 17** 의 “Iterables Versus Iterators”, “Don’t Make the Iterable an Iterator for Itself” 에 대응하는 학습 노트.
> 참고: [Python Glossary – iterable, iterator](https://docs.python.org/3/glossary.html), [`collections.abc`](https://docs.python.org/3/library/collections.abc.html) (`Iterable`, `Iterator` ABCs), [PEP 234 – Iterators](https://peps.python.org/pep-0234/), [PEP 255 – Simple Generators](https://peps.python.org/pep-0255/), [PEP 492 – Coroutines with async and await syntax](https://peps.python.org/pep-0492/) (참고로 비교 대상), [PEP 525 – Asynchronous Generators](https://peps.python.org/pep-0525/).

---

## 2.1 도입: “같은 객체인데 왜 두 번 순회할 수 없을까?”

어떤 객체가 `for` 루프에 잘 들어가는데도, 두 번째 `for` 루프는 빈 결과를 내는 경험을 한 적이 있을 것이다. 가장 흔한 예는 다음 두 가지다.

```python
# (1) zip 객체
z = zip([1, 2, 3], ['a', 'b', 'c'])
list(z)        # [(1, 'a'), (2, 'b'), (3, 'c')]
list(z)        # []   ← 두 번째는 비어 있음

# (2) map 객체
m = map(str.upper, "abc")
list(m)        # ['A', 'B', 'C']
list(m)        # []
```

이 두 객체는 둘 다 `for` 루프에 넣을 수 있는 “iterable” 인데, 동시에 한 번 순회하면 끝나는 “iterator” 다. 이 모순 같은 상황을 이해하려면 iterable 과 iterator 의 정확한 정의를 짚고, **두 인터페이스가 의도적으로 분리된 이유** 를 알아야 한다. 이 섹션의 목표가 바로 그것이다.

핵심 요지는 다음 한 줄로 요약된다.

> **“iterable 은 컨테이너” 다. “iterator 는 그 컨테이너 위를 한 번 지나가는 손님” 이다. 손님을 컨테이너로 만들면 두 번 지나갈 수 없다.**

이제 그 이유를 파이썬의 표준 자료형 정의부터 천천히 풀어 본다.

---

## 2.2 공식 정의: Glossary 와 `collections.abc` 의 표현

Python 3.12 [Glossary](https://docs.python.org/3/glossary.html) 에는 두 항목이 따로 적혀 있다.

### 2.2.1 iterable

> “An object capable of returning its members one at a time. Examples of iterables include all sequence types (such as `list`, `str`, and `tuple`) and some non-sequence types like `dict`, `file objects`, and objects of any classes you define with an `__iter__()` method or with a `__getitem__()` method that implements Sequence semantics.
>
> Iterables can be used in a `for` loop and in many other places where a sequence is needed (`zip()`, `map()`, …). When an iterable object is passed as an argument to the built-in function `iter()`, it returns an iterator for the object.”

이 정의에서 강조할 사실은 세 가지다.

* iterable 은 **“한 번에 하나씩 멤버를 반환할 수 있는 능력”** 의 추상적 명세다.
* 구현 측면에서는 `__iter__` 가 있거나, `__getitem__` 으로 시퀀스 시맨틱을 구현한 객체가 iterable 이다.
* `iter()` 가 인자로 받으면 **iterator 를 반환** 한다. 이 한 문장이 iterable 과 iterator 의 경계를 긋는다.

### 2.2.2 iterator

> “An object representing a stream of data. Repeated calls to the iterator’s `__next__()` method (or passing it to the built-in function `next()`) return successive items in the stream. When no more data is available a `StopIteration` exception is raised instead. At that point, the iterator object is exhausted and any further calls to its `__next__()` method just raise `StopIteration` again.
>
> Iterators are required to have an `__iter__()` method that returns the iterator object itself so every iterator is also iterable and may be used in most places where other iterables are accepted.”

여기서도 두 가지가 중요하다.

* iterator 는 `__next__` 를 갖고, 매 호출마다 다음 항목을 돌려주다가 `StopIteration` 을 일으킨다.
* iterator 의 `__iter__` 는 *대부분* 자기 자신을 반환한다. 따라서 **iterator 는 동시에 iterable 이다** (모든 iterator 가 iterable 의 부분집합). 하지만 **그 역은 성립하지 않는다** (모든 iterable 이 iterator 인 것은 아니다).

### 2.2.3 `collections.abc` 의 형태

[`collections.abc`](https://docs.python.org/3/library/collections.abc.html) 모듈은 이 두 개념을 ABC 로 형식화한다.

```text
Iterable           # __iter__ 만 요구
    └── Iterator   # __iter__(자기 자신 반환) + __next__ 요구
```

* `Iterable` ABC 는 `__iter__` 의 존재만 검사한다. `__abstractmethods__ == {'__iter__'}`.
* `Iterator` ABC 는 `__iter__` 와 `__next__` 둘 다 검사한다. `__abstractmethods__ == {'__iter__', '__next__'}`.
* `Iterator` 는 `Iterable` 의 서브클래스로 등록돼 있다. (실제 `collections.abc.Iterator` 의 정의에 `__iter__` 와 `__next__` 가 abstract 로 표시돼 있고, `__subclasshook__` 이 두 메서드의 존재를 확인한다.)

이 두 ABC 의 관계가 iterable 과 iterator 의 관계를 그대로 형식화한다. **모든 iterator 는 iterable 이지만, 모든 iterable 이 iterator 인 것은 아니다.** 엄밀히 말하면, iterator 가 iterable 의 *서브 인터페이스* 다.

```python
from collections.abc import Iterable, Iterator

isinstance([1, 2, 3], Iterable)    # True
isinstance([1, 2, 3], Iterator)    # False
isinstance(iter([1, 2, 3]), Iterator)   # True
isinstance(iter([1, 2, 3]), Iterable)   # True   ← iterator 도 iterable
```

`list` 는 iterable 지만 iterator 가 아니고, `iter(list)` 의 결과는 iterator 다. 이 한 줄이 섹션의 80%를 설명한다.

---

## 2.3 두 인터페이스를 코드 레벨로 분해

### 2.3.1 Iterable 인터페이스

Iterable 은 다음 조건을 만족하는 객체다.

1. `__iter__(self)` 메서드를 갖고, **새로운 iterator** 를 반환한다. (정확히는 “`iter(self)` 가 호출되었을 때 사용 가능한 iterator 를 얻을 수 있어야 한다.” `__iter__` 가 정의되지 않은 경우, legacy `__getitem__` 시퀀스 프로토콜로 fallback 한다.)
2. (선택) `__getitem__(self, index)` 메서드를 0-based 인덱싱과 `IndexError` 시맨틱으로 구현해도 iterable 로 인정된다.

```python
class Bag:
    """Iterable 인터페이스만 구현한 컨테이너"""
    def __init__(self, *items):
        self._items = list(items)
    def __iter__(self):                  # (1)
        return BagIterator(self._items)  # 새 iterator 를 반환
    def __len__(self):
        return len(self._items)
    def __repr__(self):
        return f"Bag({self._items!r})"

class BagIterator:
    def __init__(self, items):
        self._items = items
        self._index = 0
    def __iter__(self):
        return self
    def __next__(self):
        if self._index >= len(self._items):
            raise StopIteration
        v = self._items[self._index]
        self._index += 1
        return v
```

`Bag` 는 `__iter__` 만 갖는 iterable 이다. `BagIterator` 는 iterator 다. 이 분리가 핵심이다.

### 2.3.2 Iterator 인터페이스

Iterator 는 다음 조건을 만족한다.

1. `__iter__(self)` 를 갖고, *보통* `self` 를 반환한다. ([공식 문서](https://docs.python.org/3/library/stdtypes.html#iterator-types) 는 “iterators should also define `__iter__` to return `self`.” 라고 기술한다. 반드시 `self` 일 필요는 없지만, 일관성과 직관성을 위해 그렇게 구현하는 것이 관례다.)
2. `__next__(self)` 를 갖고, 매 호출마다 다음 항목을 반환하거나 `StopIteration` 을 일으킨다.

```python
def __iter__(self): return self
def __next__(self): ...
```

`for` 루프는 `__iter__` 와 `__next__` 만 본다. **iterable 과 iterator 를 정의하는 메서드 집합이 다르다.** iterable 은 `__iter__` 만, iterator 는 `__iter__` + `__next__`. 이 메서드 집합의 차이가 곧 인터페이스의 차이다.

### 2.3.3 duck typing 으로 보는 인터페이스

`collections.abc.Iterable` 과 `collections.abc.Iterator` 는 “ABC” 일 뿐, 실제로 동작하는 데는 `__iter__` / `__next__` 가 있는지만이 중요하다. 따라서 다음 두 클래스는 둘 다 iterable 이지만 의미가 다르다.

```python
class A:                         # iterable
    def __iter__(self): return iter([1, 2, 3])

class B:                         # iterator
    def __iter__(self): return self
    def __next__(self):
        if not hasattr(self, "i"): self.i = 0
        if self.i >= 3: raise StopIteration
        self.i += 1
        return self.i
```

`A` 의 `__iter__` 는 매번 새 iterator 를 만든다. `B` 의 `__iter__` 는 `self` 를 돌려주므로 두 번째 순회가 불가능하다.

---

## 2.4 “왜 iterable 은 자기 자신의 iterator 가 되면 안 되는가”

이제 본 섹션의 핵심으로 들어온다. Fluent Python 은 짧지만 굵은 한 섹션을 통째로 “Don’t Make the Iterable an Iterator for Itself” 에 할당한다. 다음 코드를 보자.

```python
class OneShotIterable:                # ❌ 안티패턴
    def __iter__(self): return self
    def __next__(self):
        if not hasattr(self, "_used"):
            self._used = False
        if self._used:
            raise StopIteration
        self._used = True
        return "singleton"

o = OneShotIterable()
for x in o: print(x)        # singleton
for x in o: print(x)        # (출력 없음)
```

이 코드는 *동작은 한다*. 하지만 동시에 **iterable 이다** 라는 기대를 한 번 어긴다. 왜냐면:

1. iterable 의 의미는 “여러 번 순회 가능한 컨테이너” 다. 위 `o` 는 두 번째 순회부터 결과가 비어 있다.
2. `for` 문이 두 번 들어가는 패턴은 코드에서 매우 흔하다. (예: 같은 객체에 한 번은 검증, 한 번은 본 처리) 사용자는 자연스럽게 두 번째 순회도 가능하다고 가정한다.
3. `len(o)`, `o[0]`, `list(o)` 같은 작업이 한 번에 다 끝나버려, “한 번에 하나씩 본다” 는 iterator 의 의도와 어긋나게 사용될 여지가 있다.

Fluent Python 의 표현을 그대로 옮기면 다음과 같다.

> “By definition, iterator objects are required to support the `__iter__` method that returns `self` (i.e., themselves). An iterable is not necessarily an iterator. An iterable should never be its own iterator. That is, an iterable’s `__iter__` should return a different object — typically a fresh iterator object each time — to allow multiple iterations.”

이유는 단순하다. **iterable 의 `__iter__` 는 “새로운 iterator” 를 만들어야 한다.** 그래야 같은 iterable 을 여러 번 순회할 수 있다. 만약 `__iter__` 가 `self` 를 돌려주면, 그 객체는 iterator 가 되어버리고, 한 번 순회하면 끝나버린다.

### 2.4.1 잘못된 패턴이 매력적인 이유

그런데 왜 사람들은 이 실수를 자주 할까? 두 가지 이유가 있다.

* **테스트가 짧을 때 잘 동작한다.** `for x in obj:` 한 번 호출, `next(obj)` 한두 번 호출 정도로는 문제 없이 보일 수 있다.
* **클래스를 iterable 과 iterator 두 가지로 나누면 파일이 늘고 코드가 길어진다.** 한 클래스에 `__iter__` 와 `__next__` 를 같이 두면 간결해 보인다.

하지만 이 간결함은 “두 번째 순회” 라는 가장 흔한 사용 패턴을 망가뜨린다. 표준 라이브러리의 `zip`, `map`, `filter`, `enumerate`, `reversed` 같은 객체가 일관되게 iterator 로 구현된 이유가 바로 이 때문이다. 사용자는 “이것은 한 번 순회하는 객체” 라는 점을 명확히 인지하고 코드를 짠다.

### 2.4.2 표준 라이브러리의 사례

파이썬 표준 라이브러리에서 일관되게 따르는 규칙은 다음과 같다.

* **컨테이너 (`list`, `tuple`, `dict`, `set`, `str`, 사용자 정의 컬렉션) 는 iterable** 다. 자기 자신의 iterator 가 아니다. `iter()` 를 호출하면 *새* iterator 가 나온다.
* **값 스트림 객체 (`zip`, `map`, `filter`, `enumerate`, `reversed`, `iter(callable, sentinel)`, generator, file) 는 iterator** 다. 한 번 순회하면 끝난다.

이 규칙을 어기는 경우는 (a) 정말 일회용 객체임을 명시한 경우이거나, (b) 단일 항목 상수 컨테이너 (예: “다음 한 번만 만들 수 있는 일회용 토큰”) 같은 매우 특수한 경우다. 일반적인 데이터 컬렉션이라면 절대 iterable 을 자기 자신의 iterator 로 만들면 안 된다.

### 2.4.3 `range` 와 `dict` 의 iterator

`range` 와 `dict` 는 흥미로운 사례다. 둘 다 iterable 지만 iterator 가 아니다.

```python
r = range(5)
iter(r) is r            # False
iter(iter(r)) is iter(r)  # True
```

`range` 는 “불변의 lazy 시퀀스” 처럼 동작하지만, 실제로는 모든 값을 미리 알고 있는 정수 시퀀스 객체다. 따라서 `__iter__` 를 호출할 때마다 *새* `range_iterator` 가 만들어진다. `dict` 도 마찬가지다. `iter(d)` 는 *새* `dict_keyiterator` 를 만든다.

```python
d = {'a': 1, 'b': 2}
it1 = iter(d)
it2 = iter(d)
next(it1)   # 'a'
next(it1)   # 'b'
next(it2)   # 'a'   ← it2 는 it1 과 무관하게 처음부터
```

이 성질 덕분에 `dict` 같은 컨테이너를 여러 부분에서 동시에 순회할 수 있다.

---

## 2.5 표준 인터페이스를 명시적으로 표시하기

사용자 클래스를 작성할 때는 **`collections.abc` 의 ABC 를 상속** 하면 인터페이스가 명확해진다.

```python
from collections.abc import Iterable, Iterator

class Bag(Iterable):                # ← Iterable 인터페이스임을 명시
    def __init__(self, *items):
        self._items = list(items)
    def __iter__(self):
        return BagIterator(self._items)

class BagIterator(Iterator):        # ← Iterator 인터페이스임을 명시
    def __init__(self, items):
        self._items = items
        self._index = 0
    def __next__(self):
        if self._index >= len(self._items):
            raise StopIteration
        v = self._items[self._index]
        self._index += 1
        return v
```

상속 자체는 `__iter__` / `__next__` 를 자동 구현하지 않는다. 단지 `isinstance` 검사가 통과하도록 만들어 주는 역할만 한다. 이 패턴은 “**Zope Interface, Java interface, C# interface 처럼 명시적인 의도를 코드에 새기는**” 효과가 있다.

다만 3.9 이전 버전에서는 `collections.abc.Iterable` 을 상속하면 `__iter__` 를 반드시 구현해야 한다는 점에서 강제력이 있다. 3.9 부터는 `__class_getitem__` 같은 변화로 ABC 사용 패턴이 약간 바뀌었지만, “상속으로 인터페이스 명시” 라는 관용은 여전히 유효하다. ([PEP 585 – Type Hinting Generics In Standard Collections](https://peps.python.org/pep-0585/) 참고.)

### 2.5.1 `Iterator` 를 상속하지 않는 이유

`Iterator` ABC 를 상속하면 자동으로 `__iter__` 가 `self` 를 반환하도록 만들어진 메서드를 얻게 된다. 그런데 이 메서드는 **부모의 `__iter__` 가 `self` 를 반환하는 식으로 고정** 되기 때문에, **iterable 의 “새 iterator 반환”** 시맨틱과 어긋난다. 따라서 사용자 클래스를 작성할 때는 **`Iterable` 만 상속** 하고, `__iter__` 안에서 *별도* iterator 객체를 만들어 반환하는 편이 안전하다.

실제로 표준 라이브러리 `list`, `tuple`, `dict` 같은 내장 컨테이너는 `Iterable` 의 시맨틱(“새 iterator 반환”)을 따른다.

---

## 2.6 표준 라이브러리에서의 iterator 와 iterable 의 정확한 사용

### 2.6.1 파일 객체

`open()` 으로 얻은 파일 객체는 **iterator** 다. 매번 `next(f)` 가 한 줄을 반환한다. 파일을 다시 처음으로 되돌리려면 `f.seek(0)` 으로 위치를 되돌려야 한다. 즉 파일 객체는 “한 번에 한 줄씩 진행하는 손님” 에 해당한다.

```python
with open('data.txt') as f:
    for line in f:               # f 는 자기 자신의 iterator 다.
        process(line)
```

`with open(...) as f:` 안의 `for line in f:` 는 “파일은 본질적으로 한 방향으로 진행하는 데이터 스트림” 이라는 iterator 의 의도와 일치한다. **파일 객체는 iterable 처럼 보이지만 사실은 iterator 다.** 그래서 `for line in f:` 후 `f.seek(0)` 후 다시 `for line in f:` 가 가능하다. (재순회가 아니라 “위치를 되돌린 후 새로 진행” 한 것.)

### 2.6.2 `zip`, `map`, `filter`, `enumerate`, `reversed`

모두 **iterator** 다. 한 번에 한 스트림씩만 값을 내보낸다.

```python
z = zip([1, 2, 3], [4, 5])
next(z)        # (1, 4)
list(z)        # [(2, 5)]
list(z)        # []
```

`enumerate`, `reversed` 도 마찬가지다. 단, `reversed` 는 *시퀀스* 가 필요하기 때문에 시퀀스가 아닌 iterable 에서는 동작하지 않는다.

```python
list(reversed([1, 2, 3]))     # [3, 2, 1]
list(reversed(range(3)))      # [2, 1, 0]   ← range 는 시퀀스 프로토콜을 따름
# list(reversed(iter([1, 2, 3])))   # TypeError: argument to reversed() must be a sequence
```

이 차이는 `reversed` 가 `__len__` 과 `__getitem__` 을 요구하기 때문이다. `reversed` 는 sequence protocol 위에 정의된 함수이며, 임의의 iterable 에 대해 동작하지 않는다.

### 2.6.3 제너레이터

제너레이터 함수와 제너레이터 표현식의 결과는 모두 **iterator** 다. (즉, 동시에 iterable 이지만, 한 번에 한 번만 순회할 수 있다.)

```python
gen = (x * x for x in range(5))
list(gen)        # [0, 1, 4, 9, 16]
list(gen)        # []   ← 두 번째는 비어 있음
```

제너레이터는 자동으로 `__iter__`(self 반환) 와 `__next__` 를 제공하므로, `collections.abc.Iterator` 의 서브타입이다.

### 2.6.4 `itertools` 의 모든 객체

`itertools` 의 모든 함수는 **iterator 를 반환** 한다. `itertools.count`, `cycle`, `chain`, `islice`, `tee`, `filterfalse`, `zip_longest`, `groupby` 등은 모두 한 번에 한 항목을 yield 하는 iterator 다. `itertools.tee` 는 예외적으로 “원본 iterator 를 여러 번 순회할 수 있도록” 여러 개의 새 iterator 를 만들어 주지만, `tee` 의 *반환값* 은 *튜플* 이지 iterator 자체는 아니다.

---

## 2.7 “Iterable 인터페이스”의 추가 기능: `__contains__`, `__len__` 과의 관계

`Iterable` 은 본질적으로 “한 번에 하나씩 항목을 yield 한다” 는 약속이다. 하지만 이 약속 외에도, 컨테이너성 iterable 은 종종 다음 인터페이스를 함께 구현한다.

* `__len__(self)` — 항목 수를 반환. `len(obj)` 사용 가능.
* `__contains__(self, item)` — `item in obj` 를 지원. 미구현 시 `in` 은 O(n) 의 fallback 을 거친다.
* `__getitem__(self, index)` — 임의 접근. `__iter__` 가 없는 경우 legacy iterable 의 자격을 준다.
* `__reversed__(self)` — `reversed(obj)` 지원. `__iter__` 와 별개의 메서드.

이들 모두는 iterable 의 “확장 인터페이스” 다. **`__iter__` 가 가장 본질적** 이고, 나머지는 옵션이다. 즉 어떤 컨테이너성 객체는 `__iter__` 만 구현하고, 또 어떤 컨테이너는 시퀀스 프로토콜 전체를 구현한다.

`collections.abc` 의 ABC 계층을 보면, 이 관계가 잘 드러난다.

```text
Iterable
   ├── Collection   # __contains__, __len__ 추가
   │     ├── Sequence        # __getitem__, __len__, __contains__, ...
   │     │     ├── list, str, tuple, bytes, bytearray, memoryview
   │     ├── Set             # ...
   │     ├── MutableSet
   │     └── Mapping         # dict, ...
   └── Iterator
         (단독; Collection 과는 별개)
```

`Iterator` 는 `Collection` 의 서브타입이 *아니라는* 점을 기억해 두자. iterator 는 컨테이너 시맨틱(`__len__`, `__contains__`)이 없기 때문에, `len(it)` 같은 호출은 `TypeError` 다.

```python
it = iter([1, 2, 3])
len(it)          # TypeError: object of type 'list_iterator' has no len()
3 in it          # True   ← 단, in 은 iterator 가 소진됨
5 in it          # False
```

`in` 이 `True/False` 를 줄 수 있는 이유는 `in` 이 내부적으로 `iter()` 와 `next()` 를 사용하기 때문이다. 단, *iterator 에 대한 `in`* 은 그 iterator 를 **소진** 시킨다. (이 사실은 매우 자주 헷갈리는 부분이므로 코드를 짤 때 주의해야 한다.)

---

## 2.8 iterator 가 “일회용” 이라서 생기는 흔한 함정

iterator 가 “한 번 순회하면 끝난다” 는 사실이 코드에서 미묘한 버그를 일으키는 경우가 많다. 대표 사례를 정리한다.

### 2.8.1 함수 인자로 넘긴 iterator 가 함수 안에서 소진된다

```python
def first_n(iterable, n):
    return list(iterable)[:n]

it = iter([1, 2, 3, 4, 5])
first_n(it, 2)       # [1, 2]
first_n(it, 2)       # []   ← it 가 이미 소진됨
```

이 같은 패턴을 피하려면, 함수 안에서 `iter(iterable)` 를 다시 호출해 *새 iterator* 를 만들거나, 함수 인자를 *iterable* 로 받고 함수 안에서 `iter()` 를 호출하도록 강제해야 한다.

```python
def first_n(iterable, n):
    it = iter(iterable)         # 매번 새 iterator 생성
    return list(it)[:n]
```

`list(it)[:n]` 보다는 `list(islice(it, n))` 이 더 효율적이고 권장된다 (`itertools.islice` 는 **iterator 의 진행 상태를 직접 사용** 하므로 추가 메모리 할당이 없다).

### 2.8.2 `sorted`, `min`, `max`, `sum` 등은 내부적으로 `iter()` 를 호출

`min(iterable)` 은 내부적으로 `iter(iterable)` 를 호출해 새 iterator 를 만들어 진행한다. 따라서 iterator 를 인자로 줘도 한 번만 소비된다.

```python
it = iter([3, 1, 2])
min(it)        # 1
min(it)        # ValueError: iterable is empty
```

이 경우 `min(list(it))` 처럼 iterable 로 변환해 넘기면 매번 새 리스트를 만들어 두 번 이상 호출할 수 있다. 다만 원본을 보존해야 한다면, 처음부터 iterable 을 인자로 넘기는 습관을 들이는 것이 좋다.

### 2.8.3 `for` 와 `in` 의 의미 차이

`for x in iterable:` 은 매번 새 iterator 를 만든다. 따라서 iterable 이면 몇 번이든 순회할 수 있다.

```python
data = [1, 2, 3]
for x in data: print(x)   # 1 2 3
for x in data: print(x)   # 1 2 3   ← 두 번째도 같은 결과
```

하지만 `for x in iterator:` 는 *그 iterator* 를 한 번만 소진한다. iterator 를 여러 번 순회하고 싶다면 `iter()` 를 매번 호출해 새 iterator 를 만들거나, 그 iterator 의 의미를 *iterable* 처럼 설계해야 한다 (예: `__iter__` 가 매번 새 iterator 를 만들도록).

### 2.8.4 `tee` 로 iterator 복제

같은 iterator 의 진행 상태를 두 개 이상으로 분기하고 싶을 때 `itertools.tee` 를 쓸 수 있다.

```python
from itertools import tee
it = iter([1, 2, 3, 4])
a, b = tee(it)
list(a)        # [1, 2, 3, 4]
list(b)        # [1, 2, 3, 4]
```

`tee` 는 내부적으로 원본을 *버퍼링* 해 두 분기 모두에 같은 데이터를 전달한다. 다만 모든 분기가 동시에 진행되므로, 한 분기가 다른 분기보다 많이 진행하면 그만큼 메모리에 보존해야 한다. 이런 비용을 감수할 수 있는 경우에만 `tee` 를 쓰는 편이 좋다.

### 2.8.5 `reversed(seq)` 와 `seq[::-1]`

`reversed(seq)` 는 iterator 다. `seq[::-1]` 은 *리스트* 다.

```python
seq = [1, 2, 3]
r = reversed(seq)
list(r)        # [3, 2, 1]
list(r)        # []
seq[::-1]      # [3, 2, 1]   ← 새 리스트
```

둘은 “역방향 순회” 라는 결과는 같지만, 메모리/의미 측면에서 다르다. `reversed` 는 시퀀스 프로토콜만 요구하는 iterator 라서 임의의 큰 시퀀스에도 메모리 부담이 적다. `seq[::-1]` 은 항상 새 리스트를 만든다.

---

## 2.9 비동기 iterable / 비동기 iterator 와의 비교

파이썬 3.5 부터 도입된 `async for` 와 3.6 부터 도입된 async generator 는 비동기 세계의 iterable/iterator 다. 인터페이스가 `__aiter__` 와 `__anext__` 로 분리된다는 점만 다르고, **“iterable 은 여러 번 순회, iterator 는 한 번”** 이라는 원칙은 그대로 유지된다.

```python
class AsyncBag:
    def __aiter__(self): return AsyncBagIterator(self._items)

class AsyncBagIterator:
    def __aiter__(self): return self
    async def __anext__(self): ...
```

`__aiter__` 와 `__anext__` 가 비동기 함수 또는 코루틴이라는 점만 빼면 동기 iterable/iterator 와 동일한 분리를 따른다. 이 사실은 iterable/iterator 모델이 단순한 문법이 아니라 **파이썬의 비동기 시스템까지 일관되게 지지하는 추상** 임을 보여준다.

---

## 2.10 정리: iterable 은 “컨테이너”, iterator 는 “손님”

| 비교 축 | iterable | iterator |
| --- | --- | --- |
| 핵심 메서드 | `__iter__` (필수) | `__iter__` (`self` 반환), `__next__` |
| 본질 | 여러 번 순회 가능한 컨테이너 | 한 번 순회하는 데이터 스트림 |
| `iter()` 적용 | *새* iterator 생성 | `self` 반환 (보통) |
| 재순회 | 가능 | 불가 (일회용) |
| `len()` 지원 | 보통 함 | `TypeError` |
| `in` 의미 | 매번 새 iterator 로 검색 | iterator 를 소진하면서 검색 |
| `isinstance(., collections.abc.Iterable)` | True | True (iterator 도 iterable) |
| `isinstance(., collections.abc.Iterator)` | False (보통) | True |
| 예 | `list`, `tuple`, `dict`, `str`, `Bag` | `list_iterator`, `zip`, `map`, `filter`, `enumerate`, `reversed`, `file`, generator |

### 2.10.1 한 줄 요약

> **“iterable 은 `__iter__` 가 *매번 새 iterator* 를 만들어 주는 컨테이너다. iterator 는 `__next__` 로 한 번에 한 항목씩 yield 하는 일회용 핸들이다. 두 인터페이스를 한 객체에 합치면, ‘컨테이너는 여러 번 순회 가능’ 이라는 약속이 무너진다.”**

---

## 2.11 연습 문제

1. **iterator 의 일회용성 확인**: `enumerate([1, 2, 3])` 의 결과를 `list()` 로 두 번 호출해 보고, 매번 새로 만든 `enumerate` 객체의 결과와 비교하라.

2. **`__iter__` 가 `self` 를 반환하는 잘못된 iterable 만들기**: `__iter__` 와 `__next__` 를 모두 가진 “일회용 iterable” 클래스를 작성하고, 두 번 순회했을 때의 동작을 확인하라. 그리고 올바른 iterable/iterator 분리 패턴으로 다시 작성하라.

3. **`isinstance` 의 비대칭**: `__getitem__` 만 가진 클래스를 만들고, `isinstance(obj, Iterable)` 의 결과와 `for x in obj:` 의 동작을 비교하라. `__iter__` 를 추가한 뒤 결과를 다시 비교하라.

4. **`in` 이 iterator 를 소진시키는 사례**: `it = iter([1, 2, 3, 4, 5])` 에서 `3 in it` 를 호출한 후 다시 `list(it)` 를 호출해 결과를 확인하라. 같은 iterable 객체(`[1, 2, 3, 4, 5]`)에 `in` 을 적용하면 어떻게 되는지도 비교하라.

5. **컨테이너의 동시 순회**: 한 `dict` 로부터 두 iterator 를 만들어 각각 진행시켜 보고, 두 iterator 가 서로 영향을 주지 않음을 확인하라.

6. **`tee` 의 사용**: 위 iterator 를 `tee` 로 두 분기로 만들고, 한 분기만 많이 진행시킨 뒤 다른 분기의 동작을 관찰하라. 진행 차이만큼 메모리에 보존된다는 점을 코드로 확인하라.

7. **`len()` 의 비대칭**: `it = iter([1, 2, 3])` 에서 `len(it)`, `len([1, 2, 3])` 의 결과를 비교하고, 그 이유를 ABC 계층으로 설명하라.

---

## 2.12 더 읽을 거리

* [Python 3.12 Standard Library – `collections.abc`](https://docs.python.org/3/library/collections.abc.html)
* [Python 3.12 Standard Library – Iterator Types](https://docs.python.org/3/library/stdtypes.html#iterator-types)
* [Python 3.12 Glossary – iterable, iterator](https://docs.python.org/3/glossary.html)
* [Python 3.12 Reference – Compound statements: `for`](https://docs.python.org/3/reference/compound_stmts.html#the-for-statement)
* [PEP 234 – Iterators](https://peps.python.org/pep-0234/)
* [PEP 255 – Simple Generators](https://peps.python.org/pep-0255/)
* [PEP 479 – Change StopIteration handling inside generators](https://peps.python.org/pep-0479/)
* [PEP 492 – Coroutines with async and await syntax](https://peps.python.org/pep-0492/)
* [PEP 525 – Asynchronous Generators](https://peps.python.org/pep-0525/)
* Fluent Python 2/E – Chapter 17: “Iterables Versus Iterators”, “Don’t Make the Iterable an Iterator for Itself”

---

### 정리

이번 섹션에서 다룬 핵심을 다시 한 줄로 요약한다.

> **“iterable 은 `__iter__` 가 매번 새 iterator 를 돌려주는 컨테이너, iterator 는 `__next__` 로 한 번 진행되는 일회용 핸들. 두 인터페이스를 한 클래스에 합치면 ‘iterable 은 여러 번 순회 가능’ 이라는 약속이 깨지므로, 반드시 분리해서 설계해야 한다.”**

다음 섹션에서는 이 iterable/iterator 분리를 직접 코드로 구현하면서, **classic iterator → generator function → generator expression** 으로 점차 코드가 간결해지는 흐름을 따라가 본다.
# 섹션 3. Classic Iterators → Generator Functions → Generator Expressions

> *Fluent Python 2/E · Chapter 17* 의 “Sentence Take #2: A Classic Iterator”, “Don’t Make the Iterable an Iterator for Itself”, “Sentence Take #3: A Generator Function”, “How a Generator Works”, “Sentence Take #4: Lazy Generator”, “Sentence Take #5: Lazy Generator Expression”, “When to Use Generator Expressions” 에 대응하는 학습 노트.
>
> 참고: [PEP 255 – Simple Generators](https://peps.python.org/pep-0255/), [PEP 289 – Generator Expressions](https://peps.python.org/pep-0289/), [PEP 342 – Coroutines via Enhanced Generators](https://peps.python.org/pep-0342/), [PEP 380 – Syntax for Delegating to a Subgenerator](https://peps.python.org/pep-0380/), [`re.finditer`](https://docs.python.org/3/library/re.html#re.finditer), [`typing.Iterable`, `Iterator`](https://docs.python.org/3/library/typing.html).

---

## 3.0 도입: 같은 일을 하는 다섯 가지 `Sentence`

이 섹션의 모든 코드는 “문자열을 단어들로 끊는 iterable” 을 구현한다. 같은 일을 다섯 가지 방식으로 풀어 보고, 각 방식의 트레이드오프를 비교한다. **같은 일을 다섯 번 풀어 보는 이유** 는 각 단계가 어떤 *관점의 변화* 를 담고 있는지 보기 위해서다.

* **Take #1** (책 부록/이전 장): 시퀀스(`Sequence`) 인터페이스로 구현. 단어를 미리 리스트에 저장.
* **Take #2**: 클래식 iterator. *iterable* 과 *iterator* 를 두 클래스로 분리.
* **Take #3**: 제너레이터 함수. *한 함수* 가 iterable/iterator 를 모두 담당.
* **Take #4**: 게으른(lazy) 제너레이터. 텍스트를 정규식 `finditer` 로 한 단어씩만 yield.
* **Take #5**: 제너레이터 표현식. `#3` 또는 `#4` 의 *한 줄짜리 표현*.

Take #1 은 비교를 위한 출발점이고, 이 섹션은 본격적으로 Take #2 부터 다룬다.

```python
import re
import reprlib

RE_WORD = re.compile(r'\w+')

class Sentence:
    """Take #1: 시퀀스 인터페이스"""
    def __init__(self, text):
        self.text = text
        self.words = RE_WORD.findall(text)   # 미리 단어 리스트
    def __getitem__(self, index):
        return self.words[index]
    def __len__(self):
        return len(self.words)
    def __repr__(self):
        return f'Sentence({reprlib.repr(self.text)})'
```

Take #1 은 `Sequence` ABC 의 요구 메서드인 `__len__` 과 `__getitem__` 만 구현한다. (`__contains__`, `__iter__`, `__reversed__` 등은 상위 ABC 의 mixin 메서드가 자동 제공된다.) 이 클래스는 시퀀스 프로토콜을 따르므로 `for`, `len`, `in`, 슬라이싱, `reversed` 가 모두 잘 동작한다. **다만 `__init__` 에서 `re.findall` 로 *모든 단어를 한꺼번에* 리스트에 담는다는 점에서 “게으르지 않다.”** 텍스트가 거대하면 `words` 리스트만으로 메모리 부담이 크다.

이제 Take #2 부터 *iterable/iterator* 의 표준 인터페이스를 따라, **메모리를 한 단어씩만 사용하도록** 점차 진화한다.

---

## 3.1 Take #2: A Classic Iterator

### 3.1.1 전체 코드

```python
import re
import reprlib

RE_WORD = re.compile(r'\w+')

class Sentence:
    def __init__(self, text):
        self.text = text
        self.words = RE_WORD.findall(text)

    def __repr__(self):
        return f'Sentence({reprlib.repr(self.text)})'

    def __iter__(self):
        return SentenceIterator(self.words)   # 새 iterator 를 만든다


class SentenceIterator:
    def __init__(self, words):
        self.words = words
        self.index = 0

    def __next__(self):
        try:
            word = self.words[self.index]
        except IndexError:
            raise StopIteration()
        self.index += 1
        return word

    def __iter__(self):
        return self
```

### 3.1.2 인터페이스 분리의 의미

Take #2 의 핵심은 **두 클래스** 가 등장한다는 점이다.

* `Sentence` — 컨테이너. `__iter__` 만 갖는다. 즉 *iterable* 다. `__iter__` 는 매 호출마다 *새* `SentenceIterator` 를 만들어 반환한다.
* `SentenceIterator` — 진행 상태(여기서는 `index`)를 가진 *iterator*. `__next__` 와 `__iter__` 를 갖는다. `__iter__` 는 `self` 를 반환한다.

이 분리는 *Fluent Python* 17 장이 강조하는 “Don’t Make the Iterable an Iterator for Itself” 의 정확한 구현이다. `Sentence` 는 컨테이너 시맨틱을, `SentenceIterator` 는 진행 시맨틱을 담당한다. 사용자는 `Sentence` 를 여러 번, 동시에, 혹은 부분적으로 순회할 수 있다.

```python
s = Sentence('"The time has come," the Walrus said,')
for w in s: print(w)         # The / time / has / come / the / Walrus / said
for w in s: print(w)         # 다시 같은 결과
list(s)                      # ['The', 'time', 'has', 'come', 'the', 'Walrus', 'said']
s2 = iter(s)
next(s2)                     # 'The'
next(s2)                     # 'time'
```

`Sentence` 객체 `s` 는 여러 번 순회할 수 있고, 매번 새로운 iterator 가 만들어진다.

### 3.1.3 `__next__` 의 `try/except IndexError` 패턴

`__next__` 의 구현은 *인덱스가 범위 안에 있으면* 그 값을 돌려주고, *범위를 벗어나면* `StopIteration` 을 일으키는 단순한 패턴이다. 책에서는 `try/except IndexError` 로 처리하지만, 다음과 같이 길이 비교로도 작성할 수 있다.

```python
def __next__(self):
    if self.index >= len(self.words):
        raise StopIteration()
    word = self.words[self.index]
    self.index += 1
    return word
```

두 구현 모두 동작하지만, `try/except` 가 “경계 검사 비용” 없이 끝을 만난다는 점에서 미세하게 더 빠르다. ([Python Enhancement Proposal 문서들](https://peps.python.org/) 의 *try/except 는 빠른 성공/느린 실패에 유리하다* 는 패턴이 잘 맞는다.)

### 3.1.4 `__iter__` 가 `self` 를 반환해야 하는 이유

`SentenceIterator.__iter__` 가 `return self` 를 한 이유는, iterator 가 *그 자체로 iterable* 이어야 하기 때문이다. 앞서 1·2 섹션에서 보았듯, `for` 루프는 `iter()` 로 iterable 을 iterator 로 변환한다. iterator 가 *다시* `for` 의 인자로 들어왔을 때, “그 iterator 그대로” 가 사용되어야 한다. `__iter__` 가 `self` 를 반환하지 않으면, `for` 루프가 *다른* iterator 를 만들어 진행 상태가 분리된다.

```python
class WrongIter:
    def __iter__(self): return self
    def __next__(self):
        if not hasattr(self, "i"): self.i = 0
        if self.i >= 2: raise StopIteration
        self.i += 1
        return self.i

wi = WrongIter()
it = iter(wi)
list(it)        # [1, 2]
list(wi)        # []    ← WrongIter 가 iterable 로 쓰일 때 __iter__ → self
# 만약 __iter__ 가 새 객체를 만들면, list(wi) 는 [1, 2] 가 된다. 즉 iterator 가 일회용이라는 보장이 사라진다.
```

따라서 *iterator 의 `__iter__` 가 `self` 를 반환하는* 것은 *iterator 가 한 번만 순회할 수 있다* 는 약속을 지키기 위한 필수 규약이다.

### 3.1.5 Take #2 의 한계

Take #2 는 매우 명시적이고 교육적이다. 그러나 다음과 같은 단점이 있다.

1. `__iter__` 가 *매번* `SentenceIterator` 객체를 새로 만든다. 객체 생성과 가비지 컬렉션 비용이 매 순회마다 발생한다.
2. 클래스 두 개(`Sentence` + `SentenceIterator`)를 정의해야 하므로 코드량이 많다.
3. `self.words = RE_WORD.findall(text)` 로 *모든 단어를 미리* 저장한다. 즉 게으르지 않다.

이 세 가지 단점 중 첫 둘을 동시에 해결하는 방법이 바로 **제너레이터 함수** 다.

---

## 3.2 Take #3: A Generator Function

### 3.2.1 전체 코드

```python
import re
import reprlib

RE_WORD = re.compile(r'\w+')

class Sentence:
    def __init__(self, text):
        self.text = text
        self.words = RE_WORD.findall(text)

    def __repr__(self):
        return f'Sentence({reprlib.repr(self.text)})'

    def __iter__(self):
        for word in self.words:     # yield 가 아니라 for 안에서 yield
            yield word
```

코드량이 거의 절반으로 줄었다. 핵심 차이는 `__iter__` 가 **제너레이터 함수** 라는 점이다. 본문에 `yield` 가 들어 있는 함수를 호출하면 파이썬은 **제너레이터 객체**(generator object)를 반환한다. 그 제너레이터 객체는 `__iter__` 와 `__next__` 를 자동으로 구현하므로, `Sentence` 의 `__iter__` 호출 결과는 그 자체로 iterator 다.

### 3.2.2 제너레이터 함수 vs 일반 함수

“제너레이터 함수” 란 본문에 `yield` 표현식을 한 번 이상 포함하는 함수를 말한다. ([PEP 255](https://peps.python.org/pep-0255/) 의 정의.) 제너레이터 함수의 본문은 호출 시 *즉시* 실행되지 않는다. 대신 호출은 *제너레이터 객체* 를 반환하고, 본문은 `next()` 가 호출될 때 *진행된다*. 이 지연 실행(lazy evaluation)이 제너레이터의 가장 본질적인 특징이다.

```python
def gen123():
    print('start')           # 호출 시점에는 출력되지 않음
    yield 1                  # 첫 next() 에서 여기까지 진행
    print('after 1')
    yield 2                  # 두 번째 next() 에서 여기까지 진행
    print('after 2')
    yield 3                  # 세 번째 next() 에서 여기까지 진행
    print('done')            # 네 번째 next() 에서 StopIteration

g = gen123()
print(g)                       # <generator object gen123 at 0x...>
next(g)                        # start → 1
next(g)                        # after 1 → 2
next(g)                        # after 2 → 3
next(g)                        # done → StopIteration
```

`gen123()` 은 “함수” 라기보다 *코드 객체를 감싼 generator factory* 다. `gen123` 은 평범한 함수 객체처럼 보이지만, 호출하면 *제너레이터 객체* 가 나온다. 이 객체의 타입은 `types.GeneratorType` 이고, `collections.abc.Iterator` 의 인스턴스다.

```python
import types
from collections.abc import Iterator
g = gen123()
isinstance(g, Iterator)         # True
isinstance(g, types.GeneratorType)  # True
```

`Iterator` 의 인스턴스이므로, `g` 는 즉시 `for` 루프에 넣을 수 있다. `__iter__(self) → self` 와 `__next__(self)` 가 자동 제공된다.

### 3.2.3 제너레이터 함수가 만들어내는 객체

제너레이터 함수가 호출되어 만들어지는 객체는 다음 특징을 갖는다.

* `__iter__` — 자기 자신(`self`)을 반환한다.
* `__next__` — 본문을 `yield` 까지 진행시키고, `yield` 의 값을 반환한다. 본문이 끝에 도달하면 `StopIteration` 을 일으킨다.
* `gi_frame` — 현재 *suspended frame* (지역 변수, 마지막 명령 위치). 디버깅에 유용하다.
* `gi_running` / `gi_code` / `gi_yieldfrom` 등 인스펙션용 속성.

`gi_frame` 은 제너레이터가 *얼마나 진행했는지* 를 들여다볼 수 있는 창이다. 디버거나 코루틴 분석 도구들이 이 속성을 사용한다.

### 3.2.4 “제너레이터는 일종의 코루틴” 이라는 관점

제너레이터는 본질적으로 “*일시 정지* 했다가 *재개* 될 수 있는 함수” 다. 이 “정지/재개” 라는 능력이 코루틴과 동일하기 때문에, PEP 342 와 PEP 380 이후 제너레이터는 단순한 *iterator factory* 를 넘어 *코루틴* 으로도 쓰인다. ([PEP 342 – Coroutines via Enhanced Generators](https://peps.python.org/pep-0342/), [PEP 380 – Syntax for Delegating to a Subgenerator](https://peps.python.org/pep-0380/)) 이 주제는 *섹션 6* 에서 자세히 다룬다.

지금은 *iterator* 의 관점만 기억하면 충분하다. **제너레이터 함수가 호출되어 만들어지는 객체는 iterator 다.** `for` 루프, `next()`, `list()`, `tuple()`, `sum()` 등 모든 iterator-소비자와 호환된다.

### 3.2.5 Take #3 의 한계

Take #3 는 Take #2 의 단점 1·2 (객체 생성 비용, 두 클래스)를 해결했다. 그러나 단점 3 (게으르지 않음) 은 해결하지 못했다. `__init__` 의 `self.words = RE_WORD.findall(text)` 가 여전히 *모든 단어* 를 한꺼번에 리스트에 담는다. 텍스트가 거대하면 메모리 부담이 크다.

---

## 3.3 How a Generator Works (제너레이터의 내부 동작)

본격적으로 Take #4 로 가기 전에, *제너레이터가 내부적으로 어떻게 동작하는지* 를 한 단계 더 들여다보자. 이 내용을 이해하면, 이후 등장하는 `yield from`, 코루틴, 비동기 제너레이터까지 매끄럽게 연결된다.

### 3.3.1 호출 → generator 객체, next() → 본문 진행

```python
def gen():
    print('A')
    yield 1
    print('B')
    yield 2
    print('C')
```

* `gen()` 을 호출하면 파이썬은 본문을 아직 실행하지 않고, *suspended frame* 을 가진 *generator object* 를 만들어 반환한다.
* `next(g)` 를 호출하면 frame 이 *재개* 되어 다음 `yield` 까지 진행한다. `yield` 의 *값* 이 `next()` 의 결과로 반환된다.
* `yield` 이후의 코드는 다음 `next()` 가 호출될 때까지 *대기* 한다.
* 본문이 끝까지 진행되거나 빈 `return` 을 만나면 `StopIteration` 이 자동으로 발생한다.

이 “정지/재개” 메커니즘을 *Fluent Python* 은 “*when a generator function is called, the body doesn’t run; it returns a generator object that conforms to the iterator protocol*.” 이라고 표현한다.

### 3.3.2 `send`, `throw`, `close` — 코루틴으로서의 제너레이터

PEP 342 이후, generator object 는 다음 메서드를 추가로 갖는다.

* `g.send(value)` — `value` 를 *마지막* `yield` 의 결과로 전달한다. `next(g)` 는 `send(None)` 과 동치다.
* `g.throw(exc_type, value, traceback)` — `yield` 가 실행되던 위치에 예외를 던진다.
* `g.close()` — `GeneratorExit` 예외를 던지고, 제너레이터를 종료한다.

이 메서드들은 *iterator* 의 표준 인터페이스에는 없는, *generator* 만의 확장이다. 이 확장 때문에 generator 는 “*iterator* 의 부분집합이면서 동시에 *코루틴* 의 부분집합” 이 된다. 이 사실은 *섹션 6* 의 클래식 코루틴 단락에서 다시 다룬다.

### 3.3.3 `return` 값과 `StopIteration.value`

PEP 380 부터, 제너레이터는 `return value` 로 값을 돌려줄 수 있다. 그 값은 `StopIteration.value` 에 저장된다.

```python
def gen():
    yield 1
    yield 2
    return 'done'

g = gen()
next(g)                        # 1
next(g)                        # 2
try:
    next(g)                    # StopIteration, value='done'
except StopIteration as e:
    print(e.value)             # 'done'
```

*iterator* 의 관점에서는 `StopIteration` 의 값이 큰 의미를 갖지 않는다. 하지만 *코루틴* 의 관점에서는 “마지막 결과” 를 명시적으로 표현하는 통로가 된다. 이 통로는 `yield from` 의 종료 결과를 받는 데에도 쓰인다 (섹션 6).

### 3.3.4 `gi_frame` 으로 들여다보는 진행 상태

```python
def gen():
    x = 10
    yield x
    y = 20
    yield y
    z = 30
    yield z

g = gen()
g.gi_frame.f_locals            # {}
next(g)                        # 10
g.gi_frame.f_locals            # {'x': 10}
next(g)                        # 20
g.gi_frame.f_locals            # {'x': 10, 'y': 20}
```

`gi_frame` 은 *현재* suspended 된 frame 의 지역 변수를 보여 준다. 이 메커니즘 덕분에 제너레이터는 *상태 머신* 처럼 쓸 수 있다. 각 `yield` 가 “한 상태” 에 해당하고, `send` 가 “외부 입력” 역할을 한다.

### 3.3.5 `StopIteration` 이 leak 되지 않는 규칙 (PEP 479)

PEP 479 이전에는, 제너레이터 내부에서 *우연히* `StopIteration` 이 발생하면 그게 그대로 외부로 leak 되어 `for` 루프가 조용히 끝나버리는 미묘한 버그가 있었다. PEP 479 부터 제너레이터 내부에서 발생한 `StopIteration` 은 `RuntimeError` 로 변환된다.

```python
def gen():
    yield 1
    raise StopIteration   # PEP 479 이전: leak, 이후: RuntimeError
    yield 2
```

이 규칙 덕분에 “제너레이터 안에서 일어나는 모든 `StopIteration` 은 본문이 끝났다는 정상 신호로만 해석된다” 라는 명확한 의미가 보장된다. (코루틴과 `yield from` 의 합성에서도 이 규칙이 핵심이다.)

---

## 3.4 Take #4: Lazy Generator

이제 “게으름(laziness)” 의 문제를 해결할 차례다. Take #3 의 `__init__` 은 `re.findall` 로 *모든 단어* 를 리스트에 담는다. 이걸 *필요할 때마다* 한 단어씩만 만들도록 바꾸는 게 Take #4 다.

### 3.4.1 전체 코드

```python
import re
import reprlib

RE_WORD = re.compile(r'\w+')

class Sentence:
    def __init__(self, text):
        self.text = text

    def __repr__(self):
        return f'Sentence({reprlib.repr(self.text)})'

    def __iter__(self):
        for match in RE_WORD.finditer(self.text):  # match 객체를 한 번에 하나씩
            yield match.group()                    # 매치된 단어 문자열을 yield
```

차이는 미묘하지만 결정적이다. `finditer` 는 *match 객체* 의 iterator 를 돌려준다. 본문은 그 iterator 를 한 번에 한 match 씩 소비하면서, `match.group()` 으로 실제 단어 문자열을 yield 한다. **리스트를 만들지 않는다.** 한 번에 한 단어만 메모리에 살게 된다.

### 3.4.2 `re.finditer` 의 동작

[`re.finditer(pattern, string)`](https://docs.python.org/3/library/re.html#re.finditer) 는 *match 객체* 의 iterator 를 반환한다. 각 match 는 `Match` 객체이며, `.group()` 으로 매치된 부분 문자열을 얻는다. `re.findall` 이 *리스트* 를 만들어 한 번에 돌려주는 것과 달리, `re.finditer` 는 *필요할 때* 다음 매치를 계산한다 (정확히는 lazy match object iterator).

```python
for m in re.finditer(r'\w+', 'The time has come'):
    print(m.group(), m.start(), m.end())
# The 0 3
# time 4 8
# has 9 12
# come 13 17
```

`finditer` 는 *sentinel* 패턴을 따르는 iterator 라기보다, *내부적으로 lazy matcher* 를 노출하는 고수준 API 다. `Take #4` 는 이 `finditer` 의 laziness 를 그대로 활용한다.

### 3.4.3 게으름의 의미

`Take #4` 의 `Sentence` 는 *인스턴스가 만들어진 시점* 에는 단어를 하나도 갖고 있지 않다. `__init__` 은 `text` 만 저장한다. 단어가 계산되는 시점은 `__iter__` 가 호출되어 *본문이 처음* 실행될 때부터다. 즉:

```python
s = Sentence('A very long text...')     # 단어가 계산되지 않음
for w in s:                              # 이 시점에 __iter__ 가 호출되어 단어를 만들기 시작
    if w == 'foo':
        break                            # 'foo' 이후의 단어는 계산되지 않음
```

조기 종료 시, *나머지* 단어들은 계산되지 않는다. 이 성질은 매우 거대한 텍스트나, *언제 멈출지 모르는* 데이터 스트림에 대해 결정적인 메모리/성능 이득을 준다.

### 3.4.4 Take #4 의 두 가지 핵심 트레이드오프

게으름은 *거의 항상 좋은 것* 이지만, 두 가지 트레이드오프가 따른다.

1. **재순회할 때마다 다시 계산된다.** `Take #3` 의 `self.words` 리스트는 *캐시* 역할을 한다. `Take #4` 는 매 순회마다 `finditer` 가 매치를 다시 계산한다. 보통은 큰 부담이 아니지만, *매치 계산 비용이 비싸다면* 캐시가 필요할 수 있다.
2. **인덱싱/길이/`in` 검사 비용.** `Take #3` 는 `self.words[i]` 와 `len(self.words)` 가 O(1) 이다. `Take #4` 는 *인덱싱/길이* 인터페이스를 지원하지 않는다. `in` 검사도 O(n) 인 것은 같지만, 매치를 매번 새로 계산한다.

따라서 “`__getitem__`, `__len__` 까지 제공할 것” 이 요구사항이면 `Take #3` 류가 옳고, “*반복 한 번이면 충분*하고 *게으름이 중요*하면 `Take #4` 가 옳다. 이 선택의 본질은 *“얼마나 많은 인터페이스를 약속할 것인가?”* 다.

### 3.4.5 `__repr__` 과 디버깅

`Take #4` 의 `__repr__` 은 `text` 만 보여 준다. 단어를 보여 주려면 `finditer` 를 한 번 더 호출해야 하기 때문에, `__repr__` 에서 *전체 단어 리스트* 를 계산하는 일은 *게으름의 약속* 을 어기는 셈이다. 따라서 책에서도 `__repr__` 은 원문 일부만 보여 주는 패턴(`reprlib.repr`)을 사용한다. 이 패턴은 *iterator 기반 클래스* 의 디버깅을 도와 주는 작은 관용이다.

---

## 3.5 Take #5: Lazy Generator Expression

### 3.5.1 전체 코드

```python
import re
import reprlib

RE_WORD = re.compile(r'\w+')

class Sentence:
    def __init__(self, text):
        self.text = text

    def __repr__(self):
        return f'Sentence({reprlib.repr(self.text)})'

    def __iter__(self):
        return (match.group() for match in RE_WORD.finditer(self.text))
```

`__iter__` 가 **제너레이터 표현식** 한 줄로 바뀌었다. `Take #4` 와 정확히 같은 의미지만, 함수의 본문을 제너레이터 표현식으로 압축한 형태다.

### 3.5.2 제너레이터 표현식이란?

제너레이터 표현식(generator expression)은 리스트 컴프리헨션의 *게으른* 버전이다. ([PEP 289 – Generator Expressions](https://peps.python.org/pep-0289/)) 구문은 `(expression for item in iterable if condition)` 형태이며, 결과는 *제너레이터 객체* 다.

```python
g = (x * x for x in range(10))
type(g)                  # <class 'generator'>
list(g)                  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

제너레이터 표현식의 본질은 *“리스트 컴프리헨션이 한 번에 모든 항목을 만든다”* 와 *“제너레이터 표현식은 *필요할 때* 한 항목씩 만든다”* 의 차이다.

```python
# 리스트 컴프리헨션
[x * x for x in range(10)]        # 즉시 모든 항목을 계산

# 제너레이터 표현식
(x * x for x in range(10))        # 제너레이터 객체만 만들고 본문은 실행하지 않음
```

### 3.5.3 `Take #3` vs `Take #4` vs `Take #5` 의 비교

세 버전 모두 `for word in s:` 의 의미는 동일하다. *언제 계산하느냐* 가 다르다.

* `Take #3`: `__init__` 에서 `self.words` 리스트를 만든다. `__iter__` 는 그 리스트를 순서대로 yield 한다. **즉시성 + 캐시**.
* `Take #4`: `__init__` 에서는 아무것도 안 한다. `__iter__` 의 본문(제너레이터 함수)이 *한 번에 한 단어씩* `finditer` 로부터 yield 한다. **게으름 + 매번 재계산**.
* `Take #5`: `Take #4` 의 본문을 *제너레이터 표현식* 으로 압축한 것. **게으름 + 코드량 최소**.

이 셋의 트레이드오프를 표로 정리한다.

| 항목 | Take #3 (generator function) | Take #4 (lazy generator) | Take #5 (genexpr) |
| --- | --- | --- | --- |
| `__init__` 비용 | `re.findall` (모든 단어) | 없음 (단어 없음) | 없음 (단어 없음) |
| 단어 재계산 | 없음 (캐시) | 매 순회마다 | 매 순회마다 |
| 인덱싱(`s[i]`) | 가능 (O(1)) | 불가 | 불가 |
| `len(s)` | 가능 (O(1)) | 불가 | 불가 |
| `in` 검사 | O(n) but 캐시 | O(n) but 재계산 | O(n) but 재계산 |
| 코드 라인 수 | 1 (`__iter__`) | 2 (`__iter__`) | 1 (`__iter__`) |

어떤 버전을 선택할지는 *사용 패턴* 에 따라 다르다. 일반적으로 “한 번 순회하고 끝” 이라면 `Take #5` 가 가장 간결하고, *재순회 / 인덱싱* 이 필요하면 `Take #3` 가 옳다.

---

## 3.6 When to Use Generator Expressions

리스트 컴프리헨션과 제너레이터 표현식 사이의 선택은 실무에서 자주 마주치는 결정이다. [PEP 289](https://peps.python.org/pep-0289/) 와 Fluent Python 은 다음 가이드라인을 함께 제시한다.

### 3.6.1 “제너레이터 표현식을 기본값으로, 리스트 컴프리헨션은 의도가 분명할 때만”

PEP 289 의 핵심 권고는 다음과 같다.

> “Generator expressions are best used in situations where a list is not needed. […] They are particularly useful in situations where the list would be huge, where only a small number of elements are needed, or where the entire list does not need to be in memory at the same time.”

이 문장은 정확히 *게으�면 좋은 상황* 을 짚는다. 따라서 일반적인 가이드라인은:

* **게으름이 필요하면** 제너레이터 표현식.
* **리스트가 필요하면** (예: `len`, `sum`, `sorted`, 인덱싱, 슬라이싱) 리스트 컴프리헨션.
* **게으�이 필요하되, 결과 리스트를 자주 참조** 한다면 `list(generator_expression)` 로 명시적으로 materialize.

### 3.6.2 “체인” 의 관점

`Take #5` 의 `__iter__` 가 *제너레이터 표현식* 인 이유는, `__iter__` 가 호출되면 즉시 *제너레이터 객체* 가 반환되어야 하기 때문이다. `__iter__` 가 *리스트* 를 반환하면, 그 *리스트* 는 *iterator* 가 아니라 *iterable* 이 되어, `for` 루프가 한 번 더 `iter()` 를 호출하는 비효율이 생긴다. 또한 `__iter__` 안에서 큰 리스트를 만드는 일 자체가 `Take #3` 의 “게으르지 않음” 결함을 그대로 가져온다.

```python
# 안티패턴: __iter__ 에서 리스트 컴프리헨션
def __iter__(self):
    return [match.group() for match in RE_WORD.finditer(self.text)]   # ❌
```

이 구현은 동작은 하지만, `__iter__` 의 *의미* 와 어긋난다. `__iter__` 는 *iterator* 를 반환해야 한다. (또는 *iterator* 처럼 동작하는 객체를.) 리스트 컴프리헨션은 iterable 이지 iterator 가 아니다. ([Python Glossary](https://docs.python.org/3/glossary.html#term-iterable) 의 정의.) 물론 `for` 루프가 *다시* `iter()` 를 호출해 진행하므로 결과는 같지만, **iterator 인터페이스의 약속을 어기며, 리스트를 모두 만들어 메모리에 들고 있다는 점** 이 문제다.

### 3.6.3 “itertools, sum, any, all, max, min” 과의 궁합

제너레이터 표현식은 `sum`, `any`, `all`, `max`, `min`, `itertools` 와 함께 쓸 때 가장 강력하다.

```python
# 합계
sum(x * x for x in range(10))                 # 285

# 단축 평가 any/all
any(token == 'END' for token in tokens)        # 매치되는 순간 True 반환, 이후 계산 안 함
all(x > 0 for x in values)                    # False 발견 시 False 반환, 이후 계산 안 함

# join
data = ' '.join(line.strip() for line in text.splitlines() if line.strip())
```

이 패턴들은 **리스트 컴프리헨션 대신 제너레이터 표현식** 을 쓰면 한 번에 한 항목만 메모리에 살게 되며, `any`/`all` 처럼 *단축 평가* 가 가능한 함수와 결합하면 *필요한 만큼만* 계산하는 코드도 자연스럽게 작성된다.

### 3.6.4 “filter” 와 “map” 의 현대적 대체재

`map(func, iterable)` 과 `filter(func, iterable)` 는 *iterator* 를 반환한다. 3.x 에서 리스트 컴프리헨션/제너레이터 표현식이 권장되는 이유는 *가독성* 이다.

```python
# 구식
list(map(lambda x: x.upper(), words))                  # ❌ 가독성 떨어짐
list(filter(lambda s: len(s) > 3, words))              # ❌

# 현대식
[word.upper() for word in words]                       # ✓
[word for word in words if len(word) > 3]              # ✓
```

이 주제는 *섹션 5* 에서 더 자세히 다룬다. 다만 한 가지만 기억하자. **`map`/`filter` 의 결과는 iterator** 다. 따라서 `list(map(...))` 처럼 *즉시 materialize* 해야 하는 경우가 많다. 그럴 바에 리스트 컴프리헨션이 더 직관적이다. 반면 *iterator 만 필요한* 경우(예: `sum(map(int, lines))`)에는 `map` 도 합리적이다.

### 3.6.5 “sum/start/zip” 패턴

```python
total = sum(prod for prod in products)
avg = sum(xs) / sum(1 for _ in xs)
```

`sum` 은 *iterator 를 받아* 합을 만든다. *iterator* 의 laziness 와 *sum* 의 단일 패스가 만나 “모든 항목을 모은 뒤 합산” 이라는 중간 리스트를 피할 수 있다.

### 3.6.6 “itertools” 와 제너레이터 표현식

`itertools` 의 함수는 *iterator* 를 받아 *iterator* 를 반환한다. 따라서 제너레이터 표현식을 *iterable* 대신 *iterator* 로 직접 흘려보낼 수 있다.

```python
from itertools import islice, chain

# 상위 5개만
top5 = list(islice((x for x in data if x > 0), 5))

# 여러 제너레이터 연결
combined = chain((x for x in xs if x > 0),
                  (x for x in ys if x < 0))
```

이런 *제너레이터 파이프라인* 은 큰 데이터 처리에서 “*메모리 사용량을 한 항목 수준*으로 유지” 한다. `map`/`filter` 가 같은 일을 할 수 있지만, 표현식 형태가 더 읽기 쉬운 경우가 많다.

---

## 3.7 “Same Job, Five Takes” 의 한눈에 비교

다섯 Take 의 공통점과 차이를 정리한다.

| 항목 | Take #1 (Sequence) | Take #2 (Classic Iterator) | Take #3 (Generator Function) | Take #4 (Lazy Generator) | Take #5 (Genexpr) |
| --- | --- | --- | --- | --- | --- |
| 인터페이스 | `Sequence` | `Iterable` + `Iterator` | `Iterable`(제너레이터) | `Iterable`(제너레이터) | `Iterable`(제너레이터) |
| `__iter__` | `Sequence` mixin | `SentenceIterator` 반환 | `yield` 제너레이터 | `finditer` 순회 `yield` | `match.group() for match in finditer(...)` |
| 클래스 수 | 1 | 2 | 1 | 1 | 1 |
| 단어 저장 | `list` (즉시) | `list` (즉시) | `list` (즉시) | 없음 (게으름) | 없음 (게으름) |
| `len`, `s[i]` | 가능 | 가능 (`list`) | 가능 (`list`) | 불가 | 불가 |
| 재순회 | 항상 새로 순회 | 항상 새로 순회 | 항상 새로 순회 (list 재사용) | 매번 재계산 | 매번 재계산 |
| 코드 라인 수 (`__iter__`) | mixin 자동 | 4 (`SentenceIterator.__next__`) | 2 (yield) | 2 (for + yield) | 1 (genexpr) |

다섯 버전의 “같은 일” 을 비교해 보면, **“인터페이스는 점점 좁아지고, 본문은 점점 게으르게, 코드는 점점 짧아진다.”** 라는 명확한 흐름이 보인다. 이 흐름은 파이썬 디자인의 추세 — “*불필요한 약속은 줄이고, 본질은 유지하자*” — 를 그대로 반영한다.

---

## 3.8 흔한 실수와 미묘한 버그

### 3.8.1 “제너레이터 안에서 `return` 사용 시 값 전달”

```python
def gen():
    yield 1
    return 'finished'     # PEP 380 부터 지원
```

`return value` 의 value 는 `StopIteration.value` 에 저장된다. 외부에서 `next(g)` 의 결과로 직접 보이지 않으므로, 단독 제너레이터에서는 큰 의미가 없다. 다만 `yield from` 의 결과로는 외부에서 받을 수 있다 (섹션 6).

### 3.8.2 “제너레이터 안에서 `StopIteration` 직접 일으키기”

PEP 479 이후로, **제너레이터 본문에서 발생하는 모든 `StopIteration` 은 `RuntimeError` 로 변환** 된다. (정확히는 `PEP 479` 가 적용된 제너레이터 한정.)

```python
def bad():
    yield 1
    raise StopIteration     # RuntimeError
    yield 2
```

이 규칙은 “*`StopIteration` 은 본문이 끝났다는 신호로만 쓰여야 한다*” 라는 정의를 강제한다. 만약 본문에서 *예외로 사용* 하고 싶다면 `RuntimeError` 등 다른 예외를 써야 한다.

### 3.8.3 “제너레이터를 한 번만 순회할 수 있다”

`for x in gen: ...` 후 다시 `for x in gen: ...` 를 하면 두 번째 루프는 본문이 실행되지 않는다. **iterator 의 일회용성** 과 동일한 문제다. 제너레이터는 iterator 다. (이 부분은 *섹션 2* 에서 자세히 다뤘다.)

### 3.8.4 “제너레이터 표현식의 name binding”

```python
# 안티패턴: 흔한 실수
g = (x.upper() for x in data)
for x in g:        # 여기서 x 는 loop 변수. 안쪽 genexpr 의 x 와는 다른 이름이다.
    ...
```

이 코드는 *정상* 이지만, “*같은 이름 x*” 라는 점이 시각적으로 헷갈릴 수 있다. `x` 가 *loop variable* 과 *genexpr 의 임시 변수* 두 가지로 쓰였지만, 서로 다른 스코프다. 제너레이터 표현식 안의 변수는 표현식의 *sub-scope* 에 한정되므로 외부 `x` 와 충돌하지 않는다. (PEP 289 의 “*generator expressions in Python 3 have their own scope*.”)

### 3.8.5 “제너레이터 함수 안에서 side effect”

```python
def counter():
    count = 0
    while True:
        count += 1
        yield count
```

이런 *무한 제너레이터* 는 매우 강력하지만, **순회 종료 시점을 직접 관리** 해야 한다 (`takewhile`, `islice`, `for-break` 등). `for` 루프에 그대로 넣으면 무한히 돈다.

### 3.8.6 “제너레이터 객체의 `send` 사용 시 첫 호출은 `None` 또는 `next`”

```python
def echo():
    while True:
        value = yield
        print('got', value)
```

이 코루틴은 `next(g)` 또는 `g.send(None)` 으로 *시작* 해야 한다. `g.send(10)` 을 *처음* 호출하면 `TypeError: can't send non-None value to a just-started generator` 가 발생한다. 첫 호출이 `yield` 표현식까지 진행해야 *value* 가 들어갈 자리가 마련되기 때문이다. (이 주제는 *섹션 6* 에서 더 다룬다.)

---

## 3.9 “Sentence 다섯 Take” 의 디자인 원칙 정리

다섯 Take 를 관통하는 디자인 원칙은 다음과 같이 요약된다.

1. **“프로토콜은 좁게, 약속은 강하게.”** Take #1 은 `Sequence` 의 모든 약속(`__len__`, `__contains__`, `__getitem__`, `__reversed__` …)을 받았다. Take #4·5 는 `__iter__` 만 받았다. 약속이 좁을수록 구현과 메모리 부담이 가벼워진다.
2. **“게으름은 기본값.”** `Take #4·5` 가 “*계산은 나중에, 사용은 지금*” 이라는 laziness 의 정수를 보여 준다. 텍스트가 거대하거나 외부 데이터 스트림일수록 이 가치가 커진다.
3. **“코드량은 본질의 농도.”** Take #1 → Take #5 로 갈수록 `__iter__` 의 본문이 짧아진다. 그 짧은 코드에 “*iterator 를 돌려준다*” 라는 본질이 농축된다.
4. **“`for` 의 의미는 변하지 않는다.”** 다섯 Take 모두 `for word in s:` 가 같은 결과를 낸다. *인터페이스 약속* 이 같기 때문이다.
5. **“표준 라이브러리도 같은 진화를 거쳤다.”** `dict.items()` 는 `Take #3` 류, `re.finditer` 는 `Take #4` 류, `itertools.count` 는 `Take #4` 류. 표준 라이브러리 안에서 같은 디자인 패턴이 일관되게 적용된다.

---

## 3.10 “Generator vs. Coroutine” 의 관점

Take #3·4·5 가 보여 주는 *제너레이터* 는 본래 *iterator* 의 편의 구문이다. 그러나 [PEP 342](https://peps.python.org/pep-0342/) 이후, 제너레이터는 *코루틴* 으로도 쓰인다. 코루틴으로서의 제너레이터는 *값을 yield* 하는 동시에 *외부에서 send* 받을 수 있다. 이 확장은 *섹션 6* 에서 다룬다. 다만, *iterator* 관점의 제너레이터와 *coroutine* 관점의 제너레이터는 *겉보기에 같은 객체* 라는 점을 인식하고 있어야 한다. `gi_code` 의 `co_flags` 에 `CO_ITERABLE_COROUTINE` 같은 플래그가 설정되는 식으로 구분되지만, 사용자 코드에서는 보통 의도(intent)만으로 구분한다.

---

## 3.11 정리

* Take #1: `Sequence` ABC. `__len__`, `__getitem__` 제공. 모든 단어 즉시 저장.
* Take #2: `Iterable` + `Iterator` 두 클래스. iterable/iterator 인터페이스 분리.
* Take #3: 제너레이터 함수. `__iter__` 만 정의하고 본문에 `yield`. 한 클래스로 끝.
* Take #4: 게으른 제너레이터. `re.finditer` 로 한 단어씩 yield. 단어 저장 없음.
* Take #5: 제너레이터 표현식. `__iter__` 가 `(expr for ...)` 한 줄.

이 다섯 버전이 보여 주는 것은 “iterator/iterable 프로토콜” 의 본질 — **“`__iter__` 가 iterator 를 돌려주고, `__next__` 가 다음 항목을 돌려주거나 `StopIteration` 을 일으킨다”** — 이다. 제너레이터는 이 프로토콜을 *언어 차원에서* 자동으로 만들어 주는 syntactic sugar 다.

### 한 줄 요약

> **“classic iterator → generator function → generator expression 으로 갈수록 코드는 짧아지고, 약속은 좁아지고, 게으름은 강해진다. 그 결과는 항상 `for x in obj:` 로 똑같이 소비된다.”**

---

## 3.12 연습 문제

1. **다섯 Take 의 메모리/시간 비교**: 큰 텍스트(예: `'/usr/share/dict/words'`)로 `Sentence` 를 만들고, Take #1~5 의 메모리 사용량과 `for` 1회 순회 시간을 `timeit` / `tracemalloc` 으로 비교하라. 무엇이 가장 가벼운지, 무엇이 가장 빠른지 적어 보라.

2. **classic iterator 의 직접 구현**: `Take #2` 의 `SentenceIterator` 를 직접 작성해 보고, `__iter__` 가 `self` 를 반환해야 하는 이유를 디버거로 한 단계씩 따라가며 확인하라.

3. **제너레이터 함수 vs 제너레이터 표현식의 동치성**: 다음 두 코드가 정확히 같은 일을 하는지 확인하라.

    ```python
    def f(words):
        for w in words:
            yield w.upper()

    g = (w.upper() for w in words)
    ```

    `type(f(words))` 와 `type(g)` 의 차이도 같이 적어 보라.

4. **`re.finditer` vs `re.findall`**: 같은 텍스트에 대해 `finditer` 와 `findall` 의 메모리 사용량을 비교하라. `finditer` 의 “게으름” 이 실제 어떤 의미인지 체감해 보라.

5. **iterator 가 한 번만 순회됨을 확인**: `Take #5` 의 `Sentence` 로 `for` 를 두 번 돌려 보고, 두 번째 루프가 정상적으로 동작하는지 확인하라. `Take #5` 의 `__iter__` 는 *제너레이터 표현식* 이므로 `__iter__` 가 호출될 때마다 *새 제너레이터* 가 만들어진다. `Take #4` 와 결과가 같고, `Take #1·2·3` 와도 같다는 점을 직접 확인하라.

6. **무한 제너레이터의 안전한 사용**: `def counter(): ... yield ...` 형식의 무한 제너레이터를 만들고, `itertools.islice`, `itertools.takewhile`, `break` 로 안전하게 소비하는 세 가지 예를 작성하라.

7. **PEP 479 의 효과 확인**: 제너레이터 내부에서 `raise StopIteration` 을 일으키는 작은 함수를 만들고, `next()` 의 결과(`StopIteration` vs `RuntimeError`)가 PEP 479 이전/이후에 어떻게 달라지는지 설명하라.

---

## 3.13 더 읽을 거리

* [Fluent Python, 2/E – Chapter 17](https://www.fluentpython.com/)
* [PEP 255 – Simple Generators](https://peps.python.org/pep-0255/)
* [PEP 289 – Generator Expressions](https://peps.python.org/pep-0289/)
* [PEP 342 – Coroutines via Enhanced Generators](https://peps.python.org/pep-0342/)
* [PEP 380 – Syntax for Delegating to a Subgenerator](https://peps.python.org/pep-0380/)
* [PEP 479 – Change StopIteration handling inside generators](https://peps.python.org/pep-0479/)
* [`re.finditer`](https://docs.python.org/3/library/re.html#re.finditer)
* [`typing.Iterable`, `typing.Iterator`](https://docs.python.org/3/library/typing.html)
* [`collections.abc`](https://docs.python.org/3/library/collections.abc.html)
* Python 3.12 Reference – [Yield expressions](https://docs.python.org/3/reference/expressions.html#yield-expressions)

---

### 정리

이번 섹션의 핵심을 다시 한 문장으로 요약한다.

> **“iterable/iterator 인터페이스를 만족하는 가장 간결한 표현이 제너레이터 표현식이며, 그 위에는 본문이 짧아지는 단계(classic iterator → generator function → genexpr) 와 게으름이 강해지는 단계(gen function with cache → lazy generator) 가 함께 정렬돼 있다.”**

다음 섹션에서는 이 제너레이터 패턴을 **산술 진행(arithmetic progression)** 이라는 고전적 사례에 적용해 보고, `itertools` 가 이 패턴을 어떻게 일반화하는지 살펴본다.
# 섹션 4. Arithmetic Progression Generator, `itertools`, 그리고 표준 라이브러리의 제너레이터 함수들

> *Fluent Python 2/E · Chapter 17* 의 “An Arithmetic Progression Generator”, “Arithmetic Progression with itertools”, “Generator Functions in the Standard Library” 에 대응하는 학습 노트.
>
> 참고: [`itertools` — Functions creating iterators for efficient looping](https://docs.python.org/3/library/itertools.html), [`os.walk`](https://docs.python.org/3/library/os.html#os.walk), [`pathlib`](https://docs.python.org/3/library/pathlib.html), [`functools`](https://docs.python.org/3/library/functools.html), [`enumerate`](https://docs.python.org/3/library/functions.html#enumerate), [`re.finditer`](https://docs.python.org/3/library/re.html#re.finditer), PEP 255, PEP 289, PEP 380, [Glossary: lazy](https://docs.python.org/3/glossary.html).

---

## 4.0 도입: “산술 진행” 은 왜 좋은 예제인가

**산술 진행(arithmetic progression)** 은 어떤 시작값(`begin`), 공차(`step`), 종료 조건(`end`)을 받아 `begin, begin+step, begin+2*step, …` 를 만들어 내는 단순한 수열이다. 1·2·3·… 이나 0·2·4·… 같은 친숙한 패턴이 모두 산술 진행이다.

이 예제가 *Fluent Python* 의 17 장에서 비중 있게 다뤄지는 이유는, 다음 네 가지 디자인 결정을 한꺼번에 시험할 수 있기 때문이다.

1. **시작값 / 공차 / 종료** 의 *세 개 인자* 를 어떻게 다룰 것인가.
2. **게으름** vs **즉시성** 의 선택.
3. **iterator 인터페이스** 의 *직접 구현* vs *제너레이터 함수* 의 *간접 구현*.
4. 표준 라이브러리 **`itertools`** 의 *일반화된 빌딩 블록* 으로 같은 일을 *더 짧게* 표현하기.

이 섹션은 `ArithmeticProgression` 클래스를 네 가지 버전으로 구현하고, 마지막에 `itertools.count` + `itertools.takewhile` 로 “*마지막에 한 줄로 합치기*” 까지 본다. 그리고 나서 표준 라이브러리 안의 다양한 **제너레이터 함수**(generator function) 들을 살펴본다. `os.walk` 같은 시스템 호출부터 `pathlib`, `csv`, `re`, `functools`, `asyncio` 의 일부 API 에 이르기까지, “*iterator 를 돌려주는 표준 라이브러리 함수*” 의 폭이 얼마나 넓은지를 보여 준다.

---

## 4.1 산술 진행 1단계: 시퀀스처럼 만들기

가장 단순한 접근은 *시퀀스* 다. `range` 와 비슷하게 `__len__` 과 `__getitem__` 을 구현하면 된다.

```python
class ArithmeticProgression:
    def __init__(self, begin, step, end=None):
        self.begin = begin
        self.step = step
        self.end = end

    def __len__(self):
        if self.end is None:
            raise TypeError('cannot compute length of an infinite AP')
        return max(0, (self.end - self.begin) // self.step + 1)

    def __getitem__(self, index):
        if self.end is not None and self.begin + index * self.step >= self.end:
            raise IndexError
        return self.begin + index * self.step
```

이 클래스는 *시퀀스 프로토콜* 을 따른다. `for`, `len` (단, `end` 가 있을 때), `s[i]`, `s[a:b]` 같은 시퀀스 인터페이스를 모두 제공한다. 다만 단점이 많다.

* `len` 가 *모든 항목을 미리 알 수 있을 때만* 의미가 있다. `end=None` 으로 무한 진행을 만들면 `TypeError` 가 발생한다.
* 슬라이싱도 `__getitem__` 안에서 `range` 와 같은 시맨틱을 구현해야 완전해진다. 그 결과 `itertools.islice` 같은 함수와의 호환이 깨질 수 있다.
* `in` 검색은 `__getitem__` 으로 진행하므로 *O(n)* 인 것은 맞지만, *무한* 진행에서는 `in` 이 끝나지 않는다.

시퀀스 프로토콜은 **“*임의 접근*과 *길이*가 의미 있는 데이터”** 에 잘 맞는다. 산술 진행은 *정수* 라서 임의 접근이 *빠르긴* 하지만, *무한* 진행을 지원해야 하는 경우가 훨씬 많으므로 “*iterator 인터페이스*” 가 더 어울린다. 그래서 다음 단계에서는 `Iterable` 로 옮긴다.

---

## 4.2 산술 진행 2단계: classic iterator

이전 섹션의 `Sentence Take #2` 패턴을 산술 진행에 그대로 적용한다.

```python
class ArithmeticProgression:
    def __init__(self, begin, step, end=None):
        self.begin = begin
        self.step = step
        self.end = end

    def __iter__(self):
        return ArithmeticProgressionIterator(self.begin, self.step, self.end)


class ArithmeticProgressionIterator:
    def __init__(self, begin, step, end):
        self.current = begin
        self.step = step
        self.end = end

    def __iter__(self):
        return self

    def __next__(self):
        if self.end is not None and self.current >= self.end:
            raise StopIteration
        result = self.current
        self.current += self.step
        return result
```

이 구현은 *명시적* 이고 *교육적* 이지만, 이전 섹션에서 본 단점이 그대로 따른다. 클래스 두 개, 매 순회마다 새 iterator 생성. 이걸 **제너레이터 함수** 로 줄이면 다음과 같다.

---

## 4.3 산술 진행 3단계: 제너레이터 함수

```python
class ArithmeticProgression:
    def __init__(self, begin, step, end=None):
        self.begin = begin
        self.step = step
        self.end = end

    def __iter__(self):
        result_type = type(self.begin + self.step)
        cur = self.begin
        while self.end is None or cur < self.end:
            yield cur
            cur = result_type(cur + self.step)
```

이게 표준 라이브러리 `itertools.count` 와 매우 비슷한 형태다. (`itertools.count` 자체는 무한 진행만 지원한다. `end` 가 있는 유한 진행은 표준 라이브러리에는 별도로 없고, `itertools.islice` 또는 `itertools.takewhile` 로 잘라낸다.)

### 4.3.1 `result_type` 캐스팅

`cur = result_type(cur + self.step)` 라는 한 줄이 중요한 이유가 있다. `begin` 과 `step` 이 `int` 면 `cur` 도 `int` 다. `begin` 이 `float` 이고 `step` 이 `int` 면 `cur` 는 `float` 다. `begin` 이 `Decimal` 이고 `step` 이 `int` 면 `Decimal` 다. **타입을 캐스팅** 해 주지 않으면, 산술 진행의 “*항상 같은 타입*” 이라는 직관이 깨진다.

```python
ap = ArithmeticProgression(0, 0.1, 1)
list(ap)
# [0, 0.1, 0.2, 0.30000000000000004, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
```

`0.1 + 0.1 + 0.1` 의 부동소수점 누적 오차는 별개의 문제지만, *타입 일관성* 이라는 *사용자 기대* 는 위 캐스팅으로 보장된다. 만약 `Fraction` 처럼 *정밀 분수* 산술을 원한다면, `step` 도 같은 타입으로 맞추면 `Fraction` 진척도 자연스럽게 얻을 수 있다.

### 4.3.2 “iterator 인데 `__iter__` 만 있다” 의 위력

이 클래스 `ArithmeticProgression` 의 인터페이스는 `__iter__` 단 하나다. `__iter__` 가 *제너레이터 함수* 라서, 이 메서드 한 번이 iterator 인터페이스 전체(`__iter__`, `__next__`)를 만들어 준다. 결과적으로 이 클래스는 *iterable* 이자 *iterator factory* 다. *iterator* 자체는 아니다 (`isinstance(ap, collections.abc.Iterator) == False`).

```python
ap = ArithmeticProgression(0, 1, 3)
it = iter(ap)        # generator object
next(it)             # 0
next(it)             # 1
next(it)             # 2
next(it)             # StopIteration
list(ap)             # [0, 1, 2]   ← 새 generator 가 매번 만들어진다
list(ap)             # [0, 1, 2]   ← 재순회 가능
```

`ap` 는 *iterable* 이므로 재순회 가능하다. 매번 새 제너레이터가 만들어진다. (이것이 섹션 2에서 강조한 “iterable 은 컨테이너” 시맨틱이다.)

### 4.3.3 `ap[0]` 이 왜 안 되는가

이 클래스는 `__getitem__` 을 정의하지 않았으므로 인덱싱을 지원하지 않는다. `ap[0]` 은 `TypeError` 다. 만약 인덱싱이 필요하다면, 4.1의 시퀀스 버전으로 돌아가거나 `__getitem__` 을 따로 정의해야 한다. *iterable* 인터페이스는 *iterator* 인터페이스보다 *좁다*. *iterator* 도 `__getitem__` 을 갖지 않는다. *시퀀스* 가 `__getitem__` 을 갖는 이유는 “*임의 접근*이 의미 있는 데이터 구조” 라는 별개의 약속이기 때문이다. 산술 진행을 “*시퀀스처럼*” 다룰 것인지, “*iterator처럼*” 다룰 것인지는 *도메인의 약속* 문제다.

---

## 4.4 산술 진행 4단계: `itertools` 로 한 줄로 표현하기

표준 라이브러리 `itertools` 는 *iterator 빌딩 블록* 모음이다. `itertools.count` 는 *무한 정수 카운터* (또는 *무한 산술 진행*) 다.

```python
from itertools import count, takewhile, islice

# itertools.count(start, step): start, start+step, start+2*step, ... 무한히
for i in count(10, 2):
    print(i)
    if i >= 20:
        break
# 10 12 14 16 18 20
```

`count` 는 *step 인자가 0 이거나 양수* 일 때 영원히 증가한다. 음수 step 도 가능하다 (무한히 감소). `step=0` 은 무한히 같은 값을 yield 한다. `count` 는 step 의 부호에 따라 *언젠가 end 를 만나는지* 가 달라지므로, `takewhile` 이나 `islice` 로 잘라낸다.

```python
# takewhile: predicate 가 True 인 동안만 yield
list(takewhile(lambda x: x < 30, count(10, 3)))
# [10, 13, 16, 19, 22, 25, 28]

# islice: 슬라이스의 iterator 버전
list(islice(count(10, 3), 5))
# [10, 13, 16, 19, 22]
```

`itertools.count` + `itertools.takewhile` 의 조합은 “*무한 진행* + *조건 종료*” 의 전형이다.

### 4.4.1 `ArithmeticProgression` 과 `itertools.count` 의 비교

| 항목 | `ArithmeticProgression` (제너레이터 함수) | `itertools.count` + `takewhile` |
| --- | --- | --- |
| 유한 진행 | `end` 인자로 직접 지원 | `takewhile` 또는 `islice` 로 잘라냄 |
| 무한 진행 | `end=None` 으로 가능 | `count` 자체가 무한 |
| 타입 | 사용자 정의 (재사용성 높음) | 표준 라이브러리 (의존성 없음) |
| 코드 | ~10줄 | 1~2줄 |
| 직교성 | AP 도메인 전용 | count/takewhile 은 다른 패턴에도 재사용 가능 |

표준 라이브러리 답은 “**`count` + `takewhile` (또는 `islice`)**” 다. 직접 작성한 `ArithmeticProgression` 은 도메인 의미가 명확할 때만 쓴다. 즉 “*우리 조직은 산술 진행을 도메인 객체로 다룬다*” 라는 의도가 있을 때 좋다. 그렇지 않다면 *라이브러리 답* 이 짧고 견고하다.

### 4.4.2 다른 “*무한 iterator*” 와의 조합

`itertools.count` 는 *무한 정수열* 이지만, `itertools.cycle` 은 *무한 순환*, `itertools.repeat` 는 *무한 반복* 이다. 세 함수 모두 *무한* 이므로 `takewhile` 이나 `islice` 와 함께 쓰는 게 일반적이다.

```python
from itertools import cycle, repeat, islice, accumulate

# cycle: 주어진 iterable 을 영원히 반복
list(islice(cycle([1, 2, 3]), 8))
# [1, 2, 3, 1, 2, 3, 1, 2]

# repeat: 같은 값을 무한히 (times 인자를 주면 유한)
list(repeat('A', 5))
# ['A', 'A', 'A', 'A', 'A']

# accumulate: 누적 합 (또는 사용자 함수)
list(islice(accumulate(count(1)), 5))
# [1, 3, 6, 10, 15]
```

이 함수들은 *iterator 빌딩 블록* 으로서, 작은 함수를 결합해 *새 iterator* 를 만드는 도구다. `itertools` 가 “*iterator 의 레고*” 라고 불리는 이유가 이 때문이다.

### 4.4.3 `itertools` 의 17 가지 함수를 “*역할*” 로 분류

[`itertools` 문서](https://docs.python.org/3/library/itertools.html) 에는 약 19~20 개의 함수가 있다. 역할별로 분류하면 다음과 같다.

* **무한 iterator**: `count`, `cycle`, `repeat`
* **단축 종료**: `takewhile`, `dropwhile`, `filterfalse`
* **결합**: `chain`, `chain.from_iterable`
* **슬라이싱**: `islice`
* **선택/필터**: `compress`, `filterfalse`
* **분할**: `tee`
* **그룹화**: `groupby`
* **누적**: `accumulate`
* **zip 변형**: `zip_longest`
* **product / permutation / combination**: `product`, `permutations`, `combinations`, `combinations_with_replacement`
* **기타**: `starmap` (Python 3.x 부터 `itertools` 로 이동), `pairwise` (3.10+)

이들 대부분이 *iterator 를 받아 iterator 를 반환* 한다. 즉 **체인(chain) 이 가능한 빌딩 블록** 들이다.

```python
from itertools import chain, groupby, islice

# 0~9 짝/홀 그룹화
data = [i for i in range(10)]
groups = {k: list(g) for k, g in groupby(data, key=lambda x: x % 2)}
groups
# {0: [0, 2, 4, 6, 8], 1: [1, 3, 5, 7, 9]}

# 두 iterator 의 데카르트 곱
from itertools import product
list(product('AB', '12'))
# [('A', '1'), ('A', '2'), ('B', '1'), ('B', '2')]
```

`groupby` 는 *연속된 같은 키* 끼리 묶어 준다 (`itertools.groupby` 의 시맨틱). 정렬된 데이터에 대해서만 “*전체 그룹*” 시맨틱을 갖는다. 무작위 데이터에 대해 “*전체 그룹*” 을 원한다면 사전에 정렬하거나 `collections.defaultdict(list)` 을 써야 한다.

---

## 4.5 `ArithmeticProgression` 의 진화 — 한 클래스, 두 인터페이스

지금까지 살펴본 네 단계는 같은 일을 하는 네 가지 다른 *인터페이스* 였다.

1. `Sequence` (시퀀스 프로토콜)
2. `Iterable` + `Iterator` (두 클래스)
3. `Iterable` (제너레이터 함수)
4. `itertools.count` + `takewhile` / `islice` (라이브러리 빌딩 블록)

같은 추상 — “*시작값·공차·종료*로 정의되는 수열” — 이 점점 *더 좁은 약속* 으로 표현되었다. 약속이 좁아질수록 다음이 좋아진다.

* 코드량이 줄어든다.
* *무한* 진행을 자연스럽게 표현할 수 있다.
* `itertools` 의 다른 빌딩 블록과 합성하기 쉬워진다.

이 흐름은 *Fluent Python* 이 추구하는 “*프로토콜 좁히기*” 의 가장 분명한 사례다.

---

## 4.6 표준 라이브러리의 제너레이터 함수들

이 절에서는 표준 라이브러리 안의 *iterator 를 돌려주는* 함수들을 큰 카테고리별로 살펴본다. 이들을 통칭해 “*제너레이터 함수*” 라고 부르기도 한다 (실제 *제너레이터* 가 아니라 *iterator 를 만드는 함수* 라는 의미). 다만 책과 공식 문서에서는 두 용어를 혼용한다.

### 4.6.1 `os.path.walk` / `os.walk` — 디렉토리 트리 순회

[`os.walk`](https://docs.python.org/3/library/os.html#os.walk) 는 *디렉토리 트리* 를 깊이 우선으로 순회하며 `(dirpath, dirnames, filenames)` 의 3-튜플을 yield 한다.

```python
import os

for dirpath, dirnames, filenames in os.walk('.'):
    print(dirpath, len(dirnames), len(filenames))
```

* `dirpath` — 현재 디렉토리 경로 (문자열).
* `dirnames` — 현재 디렉토리에 있는 *서브디렉토리 이름* 리스트. `os.walk` 는 이 리스트를 *제자리에서 변경* 하면 순회 동작이 바뀐다 (다음 깊이 우선 순회 시 반영).
* `filenames` — 현재 디렉토리에 있는 *파일 이름* 리스트.

`os.walk` 는 *iterator* 다. 매번 yield 되는 3-튜플을 받아 필요한 처리를 한 뒤 버리면 된다. 매우 큰 트리도 메모리 부담 없이 순회할 수 있다.

```python
# 모든 .py 파일 찾기
for dirpath, _, filenames in os.walk('.'):
    for name in filenames:
        if name.endswith('.py'):
            print(os.path.join(dirpath, name))
```

### 4.6.2 `pathlib.Path.glob` / `rglob` — 패턴 매칭 파일 경로

`pathlib.Path.glob(pattern)` 과 `rglob(pattern)` 은 *경로 객체* 의 iterator 를 돌려준다. `glob` 의 결과도 *iterator* 다 (이전 버전은 리스트를 돌려주기도 했지만, 3.x 의 `pathlib` 는 *generator* 를 돌려준다).

```python
from pathlib import Path

p = Path('.')
for f in p.glob('**/*.py'):
    print(f)
```

`rglob` 은 `**` 패턴의 단축형이다.

```python
for f in p.rglob('*.py'):
    print(f)
```

*iterator* 다는 점이 중요하다. 매우 큰 디렉토리에서도 한 번에 한 경로씩 처리할 수 있다.

### 4.6.3 `re.finditer` — 정규식 match 의 iterator

[`re.finditer`](https://docs.python.org/3/library/re.html#re.finditer) 는 이미 3.4에서 살펴봤다. *match 객체* 의 iterator 를 돌려준다. `re.findall` 과 달리 *리스트* 를 만들지 않는다.

```python
import re
text = "The time has come, the Walrus said,"
for m in re.finditer(r'\w+', text):
    print(m.group(), m.span())
```

### 4.6.4 `csv.reader` — CSV 행의 iterator

[`csv.reader`](https://docs.python.org/3/library/csv.html#csv.reader) 는 *각 행을 리스트로* 돌려주는 iterator 다.

```python
import csv
with open('data.csv', newline='') as f:
    reader = csv.reader(f)
    for row in reader:
        # row 는 list[str] 다
        process(row)
```

*iterator* 이므로 `next(reader)` 로 한 줄씩 진행할 수 있고, `for` 루프 / `list` / `tuple` 로 모두 소비할 수 있다.

### 4.6.5 `enumerate`, `zip`, `map`, `filter`

이미 익숙한 *iterator 빌딩 블록* 들. 모두 *iterator* 를 돌려준다.

```python
enumerate(iterable)                  # (index, value)
zip(iter1, iter2, ...)               # 짧은 쪽에 맞춰 묶음
map(func, iter)                       # func(item)
filter(func_or_None, iter)            # truthy 만
```

3.x 에서는 `map` / `filter` 의 결과가 *iterator* 다. *즉시 리스트로 만들려면* `list(map(...))` 로 명시해야 한다. `zip_longest` 는 `itertools` 의 함수다.

### 4.6.6 `functools.reduce` — 누적 합성

[`functools.reduce`](https://docs.python.org/3/library/functools.html#functools.reduce) 는 “*iterable 을 받아 누적 함수로 줄인다*”. 리스트 컴프리헨션이나 `sum` 같은 *built-in reducer* 로 대체할 수 없는 *임의의 누적 함수* 를 적용할 때 유용하다. (자세한 사용 패턴은 *섹션 5* 에서 다룬다.)

### 4.6.7 `itertools.groupby` — 연속된 동일 키 묶기

[`itertools.groupby`](https://docs.python.org/3/library/itertools.html#itertools.groupby) 는 *연속된* 같은 키를 묶어 `(key, group_iterator)` 를 yield 한다. `groupby` 는 “*정렬된 데이터* 에 대해 그룹화” 한다는 점에서 SQL 의 `GROUP BY` 와 다르다. SQL 의 `GROUP BY` 는 *같은 키를 모두* 묶지만, `itertools.groupby` 는 *연속된* 같은 키만 묶는다.

```python
from itertools import groupby

data = [('a', 1), ('a', 2), ('b', 3), ('a', 4)]
for key, group in groupby(data, key=lambda x: x[0]):
    print(key, list(group))
# a [('a', 1), ('a', 2)]
# b [('b', 3)]
# a [('a', 4)]   ← 마지막 a 는 따로 묶임
```

`groupby` 의 *iterator* 자체는 한 번만 소비할 수 있다. 두 번 순회하고 싶다면 `list(group)` 로 미리 materialize 해야 한다. ([`itertools.groupby` 문서](https://docs.python.org/3/library/itertools.html#itertools.groupby) 가 “*the returned group is itself an iterator that shares the underlying iterable with groupby*” 라고 명시한다.)

### 4.6.8 `open()` 의 `file` 객체 — 라인 단위 iterator

`open(path)` 으로 얻은 *file 객체* 는 *iterator* 다. `for line in f:` 는 매번 `next(f)` 를 호출해 한 줄을 얻는다.

```python
with open('big.log', encoding='utf-8') as f:
    for line in f:                # f 자체가 iterator 다
        process(line)
```

`f.readline()` 도 iterator 의 *수동 버전* 이다. `iter(f.readline, '')` 패턴(섹션 1에서 다룸)으로 “EOF 까지 한 줄씩” 을 명시적으로 표현할 수도 있다.

### 4.6.9 `socket.recv` 와 `iter(callable, sentinel)` 의 결합

`socket` 모듈의 `recv` 메서드는 *blocking 호출* 인데, `iter(callable, sentinel)` 패턴과 결합하면 “*소켓이 닫힐 때까지 chunk 단위로 받기*” 같은 코드를 한 줄로 작성할 수 있다.

```python
import socket
from functools import partial

sock = socket.create_connection(('example.com', 80))
buf = b''
for chunk in iter(partial(sock.recv, 4096), b''):
    buf += chunk
```

*iterator* 와 *blocking I/O* 의 결합은 21 장 비동기 프로그래밍으로 확장된다.

### 4.6.10 `asyncio` 안의 제너레이터

*asyncio* 의 `asyncio.sleep`, `asyncio.open_connection`, `asyncio.StreamReader` 등은 *awaitable* 을 반환한다. (Awaitable 은 iterator 와는 다르지만, *일시 정지/재개* 라는 본질은 동일하다.) 21 장의 “*async generator*” 는 `async def` + `yield` 로 만드는 *비동기 iterator* 다. (이 주제는 *Fluent Python* 의 21 장에서 다룬다.)

### 4.6.11 `pathlib.Path.iterdir`, `read_text` 등

`Path.iterdir()` 은 *디렉토리 항목* 의 iterator 를 돌려준다.

```python
for entry in Path('.').iterdir():
    print(entry)
```

`Path.read_text()`, `Path.read_bytes()` 는 *전체 파일을 한 번에* 읽지만, 큰 파일에는 *비효율적* 일 수 있다. 큰 파일은 `open()` + `for line in f:` 가 정답이다.

### 4.6.12 `dataclasses.fields`, `asdict`, `astuple` 등

*데이터클래스* 의 `fields`, `asdict`, `astuple` 는 *tuple of Field* / *dict* / *tuple* 을 돌려준다. 이들은 *iterator* 가 아니지만, iterable 이므로 `for` 루프에 넣을 수 있다.

### 4.6.13 `typing` / `collections.abc` 의 헬퍼

* `typing.Iterable` — *제네릭* 으로, `Iterable[int]` 같은 표기가 가능하다 ([PEP 585](https://peps.python.org/pep-0585/) 이후 `collections.abc.Iterable[int]` 도 허용).
* `collections.abc` 의 `Iterable`, `Iterator`, `Generator`, `Reversible`, `Container` 등은 *ABC*. 사용자 클래스를 *이들 ABC 의 서브타입* 으로 표시하면 인터페이스 의도가 명확해진다.

```python
from collections.abc import Iterable
def first(iterable: Iterable[int]) -> int:
    it = iter(iterable)
    return next(it)
```

### 4.6.14 `functools.partial` 과 iterator

`functools.partial` 은 *callable 의 일부 인자를 고정한* 새 callable 을 만든다. *iterator* 와 결합하면 “*iter(callable, sentinel)*” 패턴에 잘 어울린다 (섹션 1에서 본 `partial(f.read, 16)` + `iter(..., b'')` 사례).

### 4.6.15 `more-itertools` (3rd-party)

표준 라이브러리에는 없지만, [`more-itertools`](https://more-itertools.readthedocs.io/) 는 *itertools 의 확장* 으로 `chunked`, `windowed`, `first`, `last`, `one`, `unique_everseen`, `flatten`, `sort_together` 등 다양한 *iterator 빌딩 블록* 을 제공한다. 큰 데이터 처리를 한다면 한 번 살펴볼 만하다.

---

## 4.7 “Standard Library 의 generator function 들” 의 큰 지도

지금까지 나열한 표준 라이브러리 함수들을 카테고리별로 다시 정리한다.

| 카테고리 | 예시 | 반환 타입 | 비고 |
| --- | --- | --- | --- |
| 디렉토리/파일 | `os.walk`, `Path.glob`, `Path.rglob`, `Path.iterdir` | iterator | 게으름, 메모리 친화 |
| 텍스트/정규식 | `re.finditer`, `csv.reader` | iterator | 한 줄 / 한 매치 단위 |
| `itertools` 빌딩 블록 | `count`, `cycle`, `repeat`, `chain`, `islice`, `takewhile`, `dropwhile`, `groupby`, `accumulate`, `product`, `permutations`, `combinations`, `filterfalse`, `compress`, `starmap`, `zip_longest`, `pairwise` | iterator | 합성 가능 |
| `functools` | `reduce`, `partial` | callable (reduce 는 단일 값) | reduce 는 합성 함수, partial 은 callable 어댑터 |
| 빌트인 | `enumerate`, `zip`, `map`, `filter`, `reversed` (시퀀스 한정) | iterator (일부 시퀀스) | 3.x 의 iterator 빌딩 블록 |
| 파일 I/O | `open()` 의 file 객체 | iterator (line 단위) | 텍스트 모드의 `for line in f:` |
| 비동기 | `asyncio` 의 coroutine/awaitable | awaitable | iterator 와 별개의 인터페이스 |
| 데이터 클래스 | `fields()`, `asdict()`, `astuple()` | iterable | 자료 구조의 일부분 |

이 표를 보면 “*iterator 를 돌려주는 표준 라이브러리*” 의 범위가 놀라울 정도로 넓다. **“*iterable/iterator 프로토콜*” 이 파이썬의 사실상 표준 데이터 인터페이스”** 라는 말이 이런 표에서 잘 드러난다.

---

## 4.8 “iterator 가 일회용” 이라는 약속의 라이브러리적 결과

표준 라이브러리의 거의 모든 *iterator 반환 함수* 는 *iterator* 를 만든다. 따라서 *두 번* 순회해야 한다면, *iterable* 을 인자로 받는 함수를 사용하거나, `list(iterator)` 로 *materialize* 해야 한다.

```python
# ❌ 두 번 순회 시도
import csv
with open('data.csv', encoding='utf-8') as f:
    r = csv.reader(f)
    list(r)         # 첫 순회
    list(r)         # 두 번째: 빈 결과

# ✓ 한 번 순회, 두 번 사용
with open('data.csv', encoding='utf-8') as f:
    rows = list(csv.reader(f))   # materialize
    process1(rows)
    process2(rows)
```

`os.walk` 도 마찬가지다. 한 번 `os.walk` 의 결과를 *iterator* 로 받은 뒤 *여러 번* 순회해야 한다면, `list(os.walk(...))` 로 명시적으로 *materialize* 해야 한다. 하지만 `os.walk` 자체를 *한 번만* 호출하고 그 안에서 모든 일을 처리하는 편이 더 자연스럽다.

### 4.8.1 `tee` 로 “두 번 순회” 만들기

`itertools.tee` 는 한 iterator 를 *두 개* 의 iterator 로 만든다. 두 iterator 는 같은 데이터를 *각각 한 번* 순회할 수 있다. 다만 `tee` 는 내부에 *버퍼* 를 두므로 한 쪽이 다른 쪽보다 많이 진행하면 그만큼 메모리에 보존된다.

```python
from itertools import tee

data = (x * x for x in range(5))
it1, it2 = tee(data, 2)
list(it1)        # [0, 1, 4, 9, 16]
list(it2)        # [0, 1, 4, 9, 16]   ← 두 번째 iterator 도 같은 결과
```

`tee` 는 “*iterator 가 두 번 순회 가능한 형태로 split*” 한다. 다만 *두 번 이상* 순회하고 싶다면 *iterable* 을 인자로 받는 함수를 사용하는 편이 더 깔끔하다.

### 4.8.2 `iter` 로 “iterable 복제”

`iter(iterable)` 은 *새 iterator* 를 만든다. *iterable* 은 재순회 가능하므로 매번 *새 iterator* 가 만들어진다. 이 점이 “*iterator 가 일회용*” 이라는 약속의 좋은 균형점이다. *iterable* 만 보장하면 라이브러리는 *iterator* 를 새로 만들 수 있다.

```python
data = [1, 2, 3]
it1 = iter(data)        # 새 iterator
it2 = iter(data)        # 또 다른 새 iterator
list(it1)               # [1, 2, 3]
list(it2)               # [1, 2, 3]   ← 두 번째도 같은 결과
```

`iter(iterator)` 의 경우는 *보통* `iterator` 가 자기 자신을 반환한다. 따라서 *iterator* 를 *두 번* 순회하려면 *iterator* 가 *iterable* 인 동시에 *여러 번* 순회 가능해야 한다 (이를 *재진입 가능 iterator* 라고 한다). 표준 라이브러리에는 거의 없다. 직접 만들 일도 흔치 않다.

---

## 4.9 게으름(laziness) 의 디자인 원칙

이번 섹션에서 반복적으로 등장한 키워드는 **게으름(laziness)** 이다. 이 디자인 원칙을 정리한다.

1. **메모리 발자국 최소화**: *필요한 만큼*만 메모리에 살게 한다. `os.walk`, `re.finditer`, `csv.reader`, `Path.glob` 같은 표준 라이브러리 iterator 들이 모두 이 원칙을 따른다.
2. **조기 종료의 가능성**: *조건을 만족하면 바로 멈출 수 있다*. `for` + `break`, `itertools.takewhile`, `itertools.islice`, `next()` + 예외 처리 등으로 *필요한 만큼만* 진행한다.
3. **합성 가능성**: *iterator* 를 *iterator* 로 받아 *iterator* 를 반환하는 함수들의 사슬로 *파이프라인* 을 만든다. `itertools` 가 대표적이다.
4. **lazy collection 의 등장**: `dict`, `list` 등 즉시 materialize 하는 자료 구조 외에, `collections.deque(maxlen=N)`, `itertools.chain`, `itertools.islice` 같은 “*게으른 컬렉션*” 도 자주 쓰인다.

### 4.9.1 “lazy vs eager” 의 선택 기준

* **데이터 크기**: 거대하면 lazy, 작으면 eager.
* **전체 사용 패턴**: 모든 항목을 다 쓸지, 일부만 쓸지. 일부만 쓴다면 lazy.
* **합성 가능성**: 다른 iterator 와 합성해야 한다면 lazy (`os.walk` 결과 + `itertools.islice` 등).
* **디버깅 편의성**: 한 번에 모두 볼 수 있다면 *list* 가 디버깅에 편리. lazy 는 *첫 n개만 본다* 같은 디버깅 모드가 별도로 필요하다.

### 4.9.2 “게으름” 의 비용

게으름에는 두 가지 비용이 따른다.

* **재계산**: *Take #4* 의 `Sentence` 처럼 매번 `finditer` 가 매치를 다시 계산한다. *Take #3* 처럼 캐시하면 메모리를 더 쓰지만 계산은 한 번뿐.
* **에러 전파 지연**: *lazy iterator* 의 *에러* 는 *실제 사용 시점* 에야 발생한다. `os.walk` 의 *권한 에러* 같은 예외는 *순회 도중* 발생한다. 코드를 작성할 때 “*iterator 가 만든 후 즉시 사용*” 패턴을 따르면 디버깅이 쉬워진다.

---

## 4.10 흔한 실수 정리

### 4.10.1 “`itertools.count` 를 `for` 로 무한히”

```python
from itertools import count
for i in count():    # 무한 루프
    print(i)
```

`count()` 는 *무한* 이므로 *조기 종료* 가 없다면 프로세스가 멈추지 않는다. 항상 `takewhile`, `islice`, `break` 등으로 종료 조건을 둔다.

### 4.10.2 “`zip` 의 길이 불일치”

`zip` 은 *짧은 쪽에 맞춰* 종료한다. 긴 쪽의 남은 항목은 버려진다. *긴 쪽* 의 모든 항목을 다루고 싶다면 `itertools.zip_longest` 를 쓴다.

```python
list(zip([1, 2, 3], ['a', 'b']))           # [(1, 'a'), (2, 'b')]
list(zip_longest([1, 2, 3], ['a', 'b'], fillvalue=None))
# [(1, 'a'), (2, 'b'), (3, None)]
```

### 4.10.3 “`groupby` 의 *전체 그룹* 오해”

`itertools.groupby` 는 *연속된* 같은 키만 묶는다. SQL 의 `GROUP BY` 처럼 동작하지 않는다. *전체 그룹* 이 필요하다면 *정렬* 후 `groupby` 하거나, `collections.defaultdict(list)` 으로 누적해야 한다.

### 4.10.4 “`os.walk` 의 *symlink* 동작”

`os.walk` 의 `followlinks=False` (기본값) 는 심볼릭 링크를 따라가지 않는다. 따라가게 하려면 `True` 로 두지만, 순환 참조가 있으면 무한 루프가 생길 수 있다.

### 4.10.5 “`Path.glob('**/*.py')` 와 `rglob('*.py')` 의 차이”

`Path.glob('**/*.py')` 는 *현재 디렉토리부터* 재귀적으로 매치한다. `rglob('*.py')` 는 같은 동작이지만 **현재 디렉토리 자체** 도 매치에 포함한다. 매치 동작의 디테일이 약간 다르므로 결과를 직접 확인해 보는 것이 좋다.

---

## 4.11 “Arithmetic Progression” 의 디자인 사례로 본 추상화

이번 절의 시작은 “*산술 진행*” 이라는 작은 사례이지만, 거기서 배운 *iterator 빌딩 블록* 의 사고방식이 표준 라이브러리 전체에 적용된다. 작은 함수가 *iterator* 를 받아 *iterator* 를 반환하고, 그 *iterator* 들이 *합성* 되어 더 큰 *iterator* 를 만든다. *iterator 빌딩 블록* 의 사슬은 함수형 프로그래밍의 *합성* 과 정확히 같은 사고방식이다. ([PEP 289](https://peps.python.org/pep-0289/) 가 의도한 “*lazy list comprehension*” 의 정신과도 맞닿아 있다.)

### 4.11.1 “iterator 합성” 의 간단한 예

```python
# 1) 0 부터 1씩 증가
# 2) 제곱
# 3) 홀수만
# 4) 상위 5개

from itertools import count, islice, filterfalse

result = list(islice(filterfalse(lambda x: x % 2 == 0, (x * x for x in count())), 5))
# [1, 9, 25, 49, 81]
```

`count → 제너레이터 표현식 → filterfalse → islice` 의 사슬은 *iterator 빌딩 블록* 의 합성이다. 각 단계가 *iterator* 를 받아 *iterator* 를 반환한다. 이 사슬은 메모리에 *단 하나의 항목* 만 살게 한다. 같은 일을 *list* 로 풀면 *모든 정수를 미리* 만들어야 한다.

### 4.11.2 “표준 라이브러리의 빌딩 블록” vs “사용자 빌딩 블록”

* 표준 라이브러리의 `itertools` 는 *범용* 이다. `count`, `cycle`, `chain` 같은 함수들은 *특정 도메인에 종속되지 않는다*. 그래서 `ArithmeticProgression` 같은 *도메인 객체* 보다는 *범용 빌딩 블록* 으로 먼저 풀어 보는 편이 좋다.
* 도메인 객체는 *의도* 를 코드에 새긴다. *“이 함수가 산술 진행을 돌려준다”* 라는 정보는 `ArithmeticProgression` 이라는 클래스 이름이 짊어진다. 라이브러리 빌딩 블록은 그 정보가 부족하다. *의도가 분명한 도메인 객체* 가 좋은지, *간결한 라이브러리 빌딩 블록* 이 좋은지는 *팀 컨벤션* 과 *재사용 빈도* 에 따라 다르다.

---

## 4.12 정리

| 주제 | 핵심 |
| --- | --- |
| 산술 진행 1 | `Sequence` (즉시성, 인덱싱 가능) |
| 산술 진행 2 | `Iterable` + `Iterator` (두 클래스) |
| 산술 진행 3 | 제너레이터 함수 (한 클래스, 게으름) |
| 산술 진행 4 | `itertools.count` + `takewhile` (한 줄) |
| 표준 라이브러리 iterator | `os.walk`, `Path.glob`, `re.finditer`, `csv.reader`, `enumerate`, `zip`, `map`, `filter`, `itertools.*` |
| 게으름 | *필요할 때* 한 항목씩, *합성 가능*, *조기 종료* 가능 |
| 일회용 iterator | 두 번 순회하려면 `tee` 또는 `list()` 로 materialize |

### 한 줄 요약

> **“산술 진행이라는 작은 사례는 ‘*iterator 빌딩 블록의 사슬*’ 사고방식의 교과서다. `itertools.count` + `takewhile` 로 한 줄로 끝나는 일을 직접 작성한 `ArithmeticProgression` 이 보여 주는 것 — ‘*도메인 객체 vs 범용 빌딩 블록*’ 의 선택은 의도와 재사용성에 달렸다.”**

---

## 4.13 연습 문제

1. **`ArithmeticProgression` 의 직접 구현**: 책의 4단계를 모두 따라 구현해 보고, 같은 호출 `list(ArithmeticProgression(0, 0.5, 3))` 의 결과가 네 단계에서 동일한지 확인하라.

2. **`itertools.count` + `takewhile` 패턴**: `count(10, -2)` (음수 step) 로 *감소하는 무한 수열* 을 만들고, `takewhile(lambda x: x > 0, ...)` 로 양수만 추출하라. 결과는 `[10, 8, 6, 4, 2]` 다.

3. **`os.walk` 의 *게으름* 확인**: 큰 디렉토리(예: `~/Library/Caches`)를 `os.walk` 로 순회하면서 *첫 5개 디렉토리* 만 처리한 뒤 멈추는 코드를 작성하라. `for` + `break` 로 충분하다.

4. **`Path.glob` vs `os.walk`**: 같은 디렉토리에서 `*.py` 파일을 찾는 두 가지 방법의 결과를 비교하라. `os.walk` 가 *재귀* 의 일관성을 명시적으로 드러내는 데 비해, `Path.rglob('*.py')` 는 한 줄로 같은 일을 한다는 점에 주목하라.

5. **`re.finditer` 와 `re.findall` 의 메모리 차이**: 매우 큰 텍스트(예: 100MB) 에서 `finditer` 와 `findall` 의 *peak memory* 를 `tracemalloc` 으로 비교하라.

6. **`itertools` 10가지 사용 예**: `count`, `cycle`, `repeat`, `chain`, `islice`, `takewhile`, `dropwhile`, `groupby`, `accumulate`, `product` 각각에 대해 “*이건 이런 상황에 쓰면 좋다*” 라는 한 줄 예시를 적어 보라.

7. **`tee` 의 *버퍼 비용* 확인**: `tee(it, 3)` 으로 세 분기를 만들고, 한 분기만 빠르게 진행시킨 뒤 다른 분기의 `gi_frame` 크기를 확인하라. `tee` 가 *얼마나 많은 메모리를 잡아먹는지* 체감하라.

8. **`zip_longest` 와 `zip` 의 차이**: 두 리스트 `[1, 2, 3]` 과 `['a', 'b']` 를 `zip` 과 `zip_longest` 로 묶어 보고, 결과의 차이를 설명하라.

---

## 4.14 더 읽을 거리

* [`itertools` — Functions creating iterators for efficient looping](https://docs.python.org/3/library/itertools.html)
* [`os.walk`](https://docs.python.org/3/library/os.html#os.walk)
* [`pathlib` — Object-oriented filesystem paths](https://docs.python.org/3/library/pathlib.html)
* [`csv` — CSV File Reading and Writing](https://docs.python.org/3/library/csv.html)
* [`re.finditer`](https://docs.python.org/3/library/re.html#re.finditer)
* [`functools.reduce`](https://docs.python.org/3/library/functools.html#functools.reduce)
* [PEP 255 – Simple Generators](https://peps.python.org/pep-0255/)
* [PEP 289 – Generator Expressions](https://peps.python.org/pep-0289/)
* [PEP 380 – Syntax for Delegating to a Subgenerator](https://peps.python.org/pep-0380/)
* [Python 3.12 Glossary – lazy](https://docs.python.org/3/glossary.html)
* [more-itertools](https://more-itertools.readthedocs.io/)

---

### 정리

이번 섹션의 핵심을 한 문장으로 다시 적는다.

> **“산술 진행이라는 작은 예제는 *iterator 빌딩 블록의 합성* 사고방식으로 압축될 수 있고, 그 사고방식이 `os.walk`, `Path.glob`, `re.finditer`, `itertools` 전체에 일관되게 적용된다. 표준 라이브러리의 거의 모든 *데이터 인터페이스* 는 결국 *iterator* 다.”**

다음 섹션에서는 이 iterator 들을 **합치는 방법(reduce, sum, any, all)** 과 함께, **`map`/`filter`/`reduce` 의 현대적 대체재** 인 *컴프리헨션 / 제너레이터 표현식* 을 다룬다.
# 섹션 5. Iterable Reducing Functions — `map`/`filter`/`reduce` 의 현대적 대체재

> *Fluent Python 2/E · Chapter 17* 의 “Iterable Reducing Functions” 에 대응하는 학습 노트. *Fluent Python 2/E · Chapter 7* “Modern Replacements for map, filter, and reduce” 의 내용도 함께 통합한다.
>
> 참고: [`sum`, `min`, `max`, `any`, `all`](https://docs.python.org/3/library/functions.html), [`functools.reduce`](https://docs.python.org/3/library/functools.html#functools.reduce), [`operator`](https://docs.python.org/3/library/operator.html), [PEP 289 – Generator Expressions](https://peps.python.org/pep-0289/), [`itertools.accumulate`](https://docs.python.org/3/library/itertools.html#itertools.accumulate).

---

## 5.0 도입: “reducing” 이라는 단어의 의미

이번 섹션의 주제는 **“iterable 을 받아 단일 값으로 줄이는 함수”** 다. 영어로는 *reducing* 또는 *fold* 라고 부른다. `sum` 이나 `any`, `all` 같은 함수는 모두 *iterable* 을 받아 단일 값을 만든다. 수학적으로 보면, “*두 개를 결합하는 함수*” 가 주어졌을 때 *iterable 의 모든 항목을 결합해 단일 값으로 줄이는* 연산이다. 이 본질은 [Haskell 의 `foldl`/`foldr`](https://www.haskell.org/), [C++ 의 `std::accumulate`](https://en.cppreference.com/w/cpp/algorithm/accumulate), [Rust 의 `Iterator::fold`](https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.fold) 와 정확히 같은 추상이다.

파이썬에서 *reducing function* 의 핵심은 다음 세 가지다.

1. *iterable* 을 인자로 받는다.
2. *단일 값* 을 반환한다.
3. *iterator* 와 *즉시* 작동하므로, *iterator* 의 *게으름* 과 *합성* 이 자연스럽게 적용된다.

파이썬의 *built-in reducing functions* 는 매우 풍부하다. `sum`, `min`, `max`, `any`, `all` 다섯 개는 *iterable* 을 직접 받아 단일 값을 만든다. 그 외에 *iterable 을 소비* 하는 함수로는 `list`, `tuple`, `set`, `dict`, `sorted`, `map`, `filter`, `zip` 같은 *제조자(builder)* 도 있지만, 이들은 *반환값이 iterable* 이므로 *reducer* 라고 부르지 않는다. *reducer* 의 반환은 *단일 값* (또는 *집합/누적 결과* 같은 “*단일 결과*” 다).

이 섹션에서는 다음을 다룬다.

* *built-in reducing functions*: `sum`, `min`, `max`, `any`, `all`, 그리고 `len` 까지.
* *현대적 대체재*: 리스트 컴프리헨션 / 제너레이터 표현식 / `itertools.accumulate`.
* *고전 `map`/`filter`/`reduce`* 의 의미와 *왜* 컴프리헨션이 더 자주 쓰이는지.
* `functools.reduce` 의 실용적 사용처.
* `operator` 모듈과 결합한 *고성능* reducer.

마지막에 이 모든 함수가 *iterator 와 만나는 지점* — “*게으름*” 과 “*조기 종료*” — 를 정리한다.

---

## 5.1 `sum` — iterable 의 합

`sum(iterable, start=0)` 은 iterable 의 항목 합을 반환한다. `start` 가 있으면 그 값을 초기값으로 더한다. ([공식 문서](https://docs.python.org/3/library/functions.html#sum))

```python
sum([1, 2, 3, 4])               # 10
sum([1, 2, 3, 4], 100)          # 110
sum([])                         # 0   ← 빈 iterable 의 합은 start (기본 0)
sum([], 100)                    # 100 ← start 가 0 이 아니면 그대로 반환
```

`sum` 은 내부적으로 *iterator* 를 받아 한 번 패스로 합을 만든다. 따라서 *제너레이터 표현식* 과 결합하면 “*모든 항목을 미리 리스트로 만든 뒤 합*” 보다 훨씬 가볍다.

```python
# 1) 즉시 리스트 → 합
sum([x * x for x in range(10)])              # 285

# 2) 제너레이터 표현식 → 합
sum(x * x for x in range(10))                # 285   ← 같은 결과, 메모리 작게
```

두 표현의 결과는 같지만 (1) 은 *모든 제곱* 을 리스트에 저장한 뒤 합한다. (2) 는 *제곱* 을 한 번에 하나씩 만들면서 즉시 합에 더한다. *iterator* 의 *게으름* 이 그대로 발휘된다.

### 5.1.1 `sum` 의 `start` 인자

`start` 는 *숫자* 가 아니어도 된다. 즉 *iterable* 의 *항목 타입과 start 의 타입이 호환되기만 하면* 어떤 결합도 가능하다. 다만 `sum` 자체는 *“`+` 연산으로 결합”* 이라는 단순한 시맨틱을 따른다. 임의의 결합(예: 문자열 결합, 사용자 정의 객체 결합)은 `functools.reduce` 나 `itertools.accumulate` 로 처리한다.

```python
sum([[1, 2], [3, 4], [5]], [])     # [1, 2, 3, 4, 5]   ← 리스트 결합
sum(['a', 'b', 'c'], '')          # 'abc'             ← 문자열 결합
```

이 두 사용은 *파이썬의 duck typing* 으로 동작한다. *내부적으로* `start + item1 + item2 + ...` 가 실행되기 때문이다.

### 5.1.2 `sum` 의 한계

`sum` 은 *iterable* 의 모든 항목을 `+` 로 결합한다. *숫자* 의 합에는 최적이다. *문자열 결합* 에도 쓸 수 있지만, *문자열의 경우 `''.join(iterable)` 이 훨씬 빠르다* ([Python Performance Tips](https://wiki.python.org/moin/PythonSpeed/PerformanceTips) 참조). *리스트 결합* 의 경우 `[a + b for a, b in pairs]` 가 `sum` 보다 *공간 복잡도* 가 좋다 (각 결합 결과를 미리 리스트로 만들지 않음).

```python
# sum 으로 문자열 결합
sum(['a', 'b', 'c'], '')          # 'abc'

# join 으로 문자열 결합
''.join(['a', 'b', 'c'])          # 'abc'   ← 일반적으로 더 빠름
```

---

## 5.2 `min` / `max` — iterable 의 최소/최대

`min(iterable)` / `max(iterable)` 은 iterable 의 최소/최대 값을 반환한다. `key=` 인자로 *정렬 키* 를 줄 수 있다.

```python
min([3, 1, 4, 1, 5, 9, 2, 6])                # 1
max([3, 1, 4, 1, 5, 9, 2, 6])                # 9

# key 함수
min(['apple', 'banana', 'cherry'], key=len)   # 'apple'
max(['apple', 'banana', 'cherry'], key=len)   # 'banana'

# 여러 인자를 직접 받는 형태
min(3, 1, 4, 1, 5)                           # 1
```

내부적으로 `min` / `max` 는 *iterable 을 한 번만 패스* 한다. 따라서 *iterator* 와 결합하면 *조기 종료* 가 자연스럽게 가능하다 (다만 `min` / `max` 자체는 *모든 항목을 비교* 해야 하므로 *진짜 의미의 조기 종료* 는 아니다).

### 5.2.1 `min` / `max` 의 `default=` 인자

빈 iterable 에 대해 `min([])` / `max([])` 는 `ValueError: min() arg is an empty sequence` 다. `default=` 를 주면 빈 iterable 일 때 그 값을 반환한다 (3.4+).

```python
min([], default=None)        # None
max([], default=0)           # 0
```

`min` / `max` 의 *default* 는 *reducer* 가 *입력 없음* 의 경우를 어떻게 표현할지* 를 정하는 도구다. *iterator* 가 *게으르다* 는 점을 고려하면, “*iterable 이 비어 있는지 아닌지* 가 순회 후에야 결정된다” 는 사실을 사용자가 미리 알 수 없다. 따라서 `default=` 가 자연스러운 해법이 된다.

### 5.2.2 `min` / `max` 와 `key` 의 합성

`min(items, key=lambda x: x.score)` 처럼 `key` 함수를 주면, *iterable 의 각 항목* 을 `key` 에 통과시킨 값으로 비교한다. 이 패턴은 다음과 같이 *제너레이터 표현식* 과 결합하면 매우 강력하다.

```python
# 가장 긴 단어
max(word for line in lines for word in line.split() if word.isalpha(), key=len)
```

*제너레이터 표현식* 이 *“문자열 line 들에서 알파벳으로만 이루어진 단어”* 를 한 번에 하나씩 만들고, `max` 가 그 중 가장 긴 것을 찾는다. *메모리* 에는 *현재까지 본 가장 긴 단어* 와 *현재 후보* 만 산다.

### 5.2.3 `min` / `max` 와 `operator.itemgetter`

`operator.itemgetter` 는 인덱싱 또는 슬라이싱을 *callable* 로 만든다. `key=` 와 결합하면 *lambda* 없이도 표현할 수 있다.

```python
from operator import itemgetter

users = [{'name': 'A', 'age': 30}, {'name': 'B', 'age': 25}]
min(users, key=itemgetter('age'))         # {'name': 'B', 'age': 25}
```

*Fluent Python* 7 장의 “*Modern Replacements for map, filter, and reduce*” 가 권장하는 패턴이다.

---

## 5.3 `any` / `all` — 진리값 누적

`any(iterable)` 은 iterable 안에 *truthy* 가 하나라도 있으면 `True` 를 반환한다. `all(iterable)` 은 iterable 의 *모든* 항목이 truthy 면 `True` 를 반환한다. ([공식 문서](https://docs.python.org/3/library/functions.html#any))

```python
any([0, 0, 1, 0])        # True
all([1, 2, 3])            # True
all([1, 0, 3])            # False
any([])                   # False
all([])                   # True   ← vacuous truth
```

### 5.3.1 단축 평가(short-circuit)

`any` 는 *truthy* 를 만나는 순간 `True` 를 반환하고 즉시 순회를 멈춘다. `all` 은 *falsy* 를 만나는 순간 `False` 를 반환하고 즉시 멈춘다. 이 *단축 평가* 는 *iterator* 의 *게으름* 과 만나 매우 강력해진다.

```python
# 'END' 가 토큰 시퀀스의 어디에 있나?
any(token == 'END' for token in tokens)        # 'END' 가 있으면 즉시 True
# 모든 단어가 알파벳인가?
all(word.isalpha() for word in words)          # falsy 발견 시 즉시 False
```

*iterator* 의 “*조기 종료*” 가 “*불필요한 계산을 안 한다*” 로 직결된다. `any`/`all` 의 *단축 평가* 와 *iterator* 의 *게으름* 이 합쳐져 “*필요한 만큼만 본다*” 라는 동일한 결론에 도달한다.

### 5.3.2 `any`/`all` 과 비교 연산

`any` / `all` 은 `or` / `and` 의 *iterable* 버전이다. *iterable* 의 각 항목을 *boolean 으로 강제 변환* (`bool(item)`) 한 뒤 *단축 평가* 한다. 따라서 다음과 같은 코드는 항상 `True` 다.

```python
all(x for x in iterable)        # iterable 의 모든 항목이 truthy 면 True
any(x for x in iterable)        # iterable 의 어떤 항목이라도 truthy 면 True
```

*주의*: `all(x for x in [1, 0, 3])` 는 `[1, 0, 3]` 의 `bool` 평가 후 `False` 다. *숫자 0* 은 falsy 다.

### 5.3.3 “*vacuous truth*” 의 의미

*all([])* 이 `True` 인 이유는 *수학적 관례* 다. “*모든 항목이 P 를 만족한다*” 라는 명제는 *항목이 없으면* 자동으로 참이다. *iterator* 와 결합할 때 이 관례는 매우 중요하다. `all(word for line in file)` 의 `file` 이 비어 있으면 `all` 은 `True` 다. “*빈 파일의 모든 줄이 조건을 만족한다*” 라는 진술이 *수학적으로* 참이라는 의미다. (실무에서는 “*빈 입력을 의도대로 처리했다*” 라는 신호로 해석된다.)

### 5.3.4 `any`/`all` 의 실용 예

```python
# CSV 행 중 어느 하나라도 'error' 컬럼 값을 가지는가?
any(row.get('level') == 'error' for row in csv.DictReader(f))

# 모든 사용자가 활성 상태인가?
all(user['active'] for user in users)

# 비어 있지 않은 줄만 처리
lines = [line for line in f if line.strip()]
non_empty = any(lines)        # lines 가 비어 있는지 검사
```

---

## 5.4 `len` — 길이, 그리고 “*len 은 왜 메서드가 아닌가*”

`len(iterable)` 은 *iterable 의 항목 수* 를 반환한다. 단, *모든 iterable* 이 `len` 을 지원하지는 않는다. *시퀀스/컨테이너* (list, tuple, dict, str 등) 와 `__len__` 을 구현한 *사용자 정의 컬렉션* 만 지원한다. *iterator* 와 *제너레이터* 는 `__len__` 을 갖지 않는다.

```python
len([1, 2, 3])              # 3
len('abc')                  # 3
len({'a': 1})               # 1
len(iter([1, 2, 3]))        # TypeError: object of type 'list_iterator' has no len()
```

`len` 이 *메서드* 가 아닌 *built-in 함수* 인 이유는 [*Fluent Python* 1 장 “Why len Is Not a Method”](https://www.fluentpython.com/) 에 잘 설명돼 있다. *효율성* 과 *일관성* 때문이다. *시퀀스* 라는 추상은 *고정된 길이* 를 자연스럽게 갖는다. `len` 을 *built-in* 으로 두면, *모든 시퀀스* 에 대해 *동일한 방식* 으로 길이를 얻을 수 있다. 메서드라면 *클래스마다* 시그니처가 달라질 수 있다.

### 5.4.1 “길이를 모르는” iterable

*iterator* / *제너레이터* 는 *모두* 길이를 모른다. *게으르게* 진행하기 때문이다. 따라서 *iterator 의 길이* 를 알기 위해서는 *전부 소비해 본다* (예: `sum(1 for _ in iterator)`).

```python
# iterator 의 길이
sum(1 for _ in it)          # O(n)
```

*iterator* 의 길이를 자주 알아야 한다면, *그 iterable 을 list 로* 만드는 편이 빠르다 (`len(list(it))`). 다만 이 경우 *iterator* 의 *게으름* 이 사라진다. *길이* 와 *게으름* 은 트레이드오프 관계다.

---

## 5.5 `functools.reduce` — 일반화된 reducer

`functools.reduce(function, iterable, initializer=None)` 은 *iterable* 을 *function* 으로 누적해 *단일 값* 으로 줄인다. 시그니처는 다음과 같다.

```text
reduce(function, iterable[, initializer])
```

* `function` 은 *두 개의 인자* 를 받고 *단일 값* 을 반환한다.
* `iterable* 의 항목을 *왼쪽부터* 차례로 결합한다.
* `initializer` 가 있으면 *누적의 시작값* 으로 사용된다.

```python
from functools import reduce

reduce(lambda acc, x: acc + x, [1, 2, 3, 4])           # 10  ((((1+2)+3)+4))
reduce(lambda acc, x: acc + x, [1, 2, 3, 4], 100)     # 110
```

내부 동작은 의사 코드로 다음과 같다.

```text
def reduce(func, iterable, init=None):
    it = iter(iterable)
    if init is None:                  # initializer 가 없으면
        try:
            value = next(it)          # 첫 항목을 초기값으로
        except StopIteration:
            raise TypeError('reduce of empty iterable with no initial value')
    else:
        value = init
    for x in it:
        value = func(value, x)        # 누적
    return value
```

`reduce` 는 “*누적 함수*” 가 *파이썬에 내장되지 않은 임의의 함수* 일 때 쓴다. 예를 들어, *모든 문자열을 결합* 하되 *중간 구분자* 를 넣는 경우.

```python
# 모든 단어를 ', ' 로 결합
reduce(lambda acc, w: acc + ', ' + w, ['apple', 'banana', 'cherry'], '')
# 'apple, banana, cherry'
```

다만 이 경우는 `', '.join(words)` 가 *훨씬 빠르고 깔끔* 하다. 즉, `reduce` 가 필요한 경우는 *join 처럼 단순한 built-in 으로 해결 안 되는* “*임의의 누적*” 다.

### 5.5.1 `reduce` 와 `sum` 의 관계

`sum(iterable)` 은 사실상 `reduce(lambda a, b: a + b, iterable, 0)` 과 같다. `sum` 의 의미를 “*시작값 0, 결합 `+`*” 로 특수화한 것이 `sum` 이다. 마찬가지로 다음도 가능하다.

```python
# 곱셈 누적 (시작값 1)
reduce(lambda a, b: a * b, [1, 2, 3, 4], 1)        # 24
```

*built-in* 으로 “*곱셈 누적*” 은 없으므로, 이런 경우 `reduce` 가 유용하다. 단, “*곱셈 누적*” 도 *iterable 의 길이가 작을 때만* 합리적이다. 큰 iterable 에서는 *수치 안정성* 과 *메모리* 를 고려해야 한다.

### 5.5.2 `reduce` vs `itertools.accumulate`

`itertools.accumulate(iterable, func=operator.add)` 는 `reduce` 와 비슷하지만 *중간 결과를 모두 yield* 한다. 즉 *iterator* 다.

```python
from itertools import accumulate
list(accumulate([1, 2, 3, 4]))                # [1, 3, 6, 10]
list(accumulate([1, 2, 3, 4], operator.mul))   # [1, 2, 6, 24]
```

`reduce` 는 *최종 값 하나*, `accumulate` 는 *중간 결과 모두*. 두 함수는 *목적* 이 다르다.

### 5.5.3 `operator` 모듈과 결합한 `reduce`

`operator` 모듈은 *연산자* 를 *callable* 로 만든다. `operator.add`, `operator.mul`, `operator.concat`, `operator.itemgetter`, `operator.attrgetter`, `operator.methodcaller` 등이 있다. `reduce` / `accumulate` / `key=` / `sorted` 와 결합하면 *lambda* 없이 표현할 수 있다.

```python
from functools import reduce
from operator import add, mul, concat

reduce(add, [[1, 2], [3, 4], [5]], [])            # [1, 2, 3, 4, 5]
reduce(mul, [1, 2, 3, 4], 1)                      # 24
reduce(concat, ['a', 'b', 'c'], '')                # 'abc'
```

`operator` 모듈의 자세한 목록은 [공식 문서](https://docs.python.org/3/library/operator.html) 에서 확인할 수 있다.

### 5.5.4 `reduce` 의 initializer 가 중요한 이유

`initializer` 가 없는 `reduce(func, [])` 는 `TypeError: reduce() of empty iterable with no initial value` 다. *iterator* 와 결합할 때, “*비어 있을 수 있다*” 는 사실을 명시하려면 `initializer` 를 주어야 한다.

```python
# ❌ 빈 iterator 에서 실패
reduce(lambda a, b: a + b, it, 0)        # initializer 0 으로 안전
```

`initializer` 가 있으면, *빈 iterator* 라도 *initializer* 가 그대로 반환된다. 따라서 *iterator 가 비어 있을 수 있는 경우* 에는 *initializer* 를 주는 것이 견고한 패턴이다.

---

## 5.6 `map` / `filter` 의 의미와 현대적 대체재

### 5.6.1 `map(function, iterable, *iterables)` 의 의미

`map` 은 *iterable 의 각 항목* 에 *function* 을 적용한 *iterator* 를 반환한다. *iterable* 이 여러 개면 *function* 은 *그 수 만큼의 인자* 를 받아야 한다. *3.x* 의 `map` 은 *iterator* 를 반환한다 (2.x 의 `map` 은 `list` 였다).

```python
list(map(int, ['1', '2', '3']))                       # [1, 2, 3]
list(map(lambda x, y: x + y, [1, 2, 3], [10, 20, 30])) # [11, 22, 33]
list(map(str.upper, 'abc'))                            # ['A', 'B', 'C']
```

`map` 의 *결과 iterator* 는 *게으르다*. 모든 항목을 미리 계산하지 않는다. 따라서 *메모리* 가 큰 iterable 에도 `map` 을 쓸 수 있다.

```python
# 큰 파일을 한 줄씩 대문자로
with open('big.txt') as f:
    for line in map(str.upper, f):        # f 가 iterator
        process(line)
```

### 5.6.2 `filter(function_or_None, iterable)` 의 의미

`filter` 는 *iterable 의 항목* 중 *function* 이 *truthy* 를 반환하는 것만 모은 *iterator* 를 반환한다. *function* 이 `None` 이면 *truthy* 항목만 통과시킨다.

```python
list(filter(lambda x: x > 0, [-1, 0, 1, 2]))         # [1, 2]
list(filter(None, [0, 1, 2, '', 'a']))               # [1, 2, 'a']
```

*iterator* 의 시점에서 `filter` 도 게으르다.

### 5.6.3 왜 컴프리헨션 / 제너레이터 표현식이 더 자주 쓰이는가

*Fluent Python* 7 장의 “*Modern Replacements for map, filter, and reduce*” 가 권장하는 결론은 다음과 같다.

* `map` / `filter` 는 *iterator* 를 만든다. *iterator* 만 필요한 경우라면 `map` / `filter` 도 좋다.
* *리스트* 가 필요한 경우, `list(map(...))` 보다는 **리스트 컴프리헨션** 이 더 가독성이 높다.
* *조건 필터링* 이 있다면, **리스트 컴프리헨션의 `if`** 가 `filter` + `lambda` 보다 명확하다.
* *reduce* 는 **`sum`, `any`, `all`, `min`, `max`** 같은 *built-in reducer* 로 처리할 수 있으면 그렇게 하고, 안 되면 `functools.reduce` 로 *임의의 누적 함수* 를 적용한다.

```python
# ❌ 구식
list(map(lambda x: x.upper(), words))                          # [W.upper() for w in words]
list(filter(lambda s: s.startswith('py'), names))             # [n for n in names if n.startswith('py')]
reduce(lambda a, b: a + b, nums, 0)                            # sum(nums)

# ✓ 현대식
[word.upper() for word in words]
[name for name in names if name.startswith('py')]
sum(nums)
```

이런 선호의 이유는 *가독성* 이다. *컴프리헨션* 은 “*무엇을* 만들 것인가” 가 코드 표면에 그대로 드러난다. *map + lambda* 는 “*무엇을* 만들 것인가” 가 `lambda` 안에 묻혀 있다. *Fluent Python* 의 표현을 빌리면, “*comprehensions are more readable*.”

다만 *iterator* 만 필요한 경우, 즉 `list` 로 materialize 하지 않아도 되는 경우라면, `map` / `filter` 도 여전히 합리적이다.

```python
# ✓ iterator 가 필요한 경우
total = sum(map(int, lines))                  # map 은 iterator 다
# vs
total = sum(int(line) for line in lines)      # 더 직관적
```

두 표현 모두 `lines` 의 *iterator* 성질을 유지한다. *가독성* 측면에서는 두 번째가 우세하다. *성능* 측면에서는 대체로 비슷하다 ([CPython 3.x 의 *inlined comprehensions*](https://peps.python.org/pep-0289/)).

### 5.6.4 `map` / `filter` 의 “*고전적*” 가치

`map` / `filter` 는 *Haskell, Lisp* 의 함수형 언어에서 직접 온 *고전 빌딩 블록* 이다. 파이썬 2.x 시대에는 *리스트* 를 반환했기 때문에 *for + 임시 리스트* 패턴을 대체하는 데 자주 쓰였다. *3.x* 의 `map` / `filter` 는 *iterator* 를 반환하므로 *메모리* 측면에서 더 좋다. 하지만 *컴프리헨션* 이 더 직관적이라 *사실상* `map` / `filter` 의 사용 빈도는 줄었다.

다만 **`operator` 모듈과의 결합** 은 여전히 가치가 있다.

```python
from operator import itemgetter
list(map(itemgetter('age'), users))                    # [30, 25]
list(map(itemgetter(0), [(1, 'a'), (2, 'b')]))         # [1, 2]
```

*itemgetter* 는 *lambda x: x['age']* 와 같지만, *C 레벨* 에서 구현되어 더 빠르다. ([`operator` 문서](https://docs.python.org/3/library/operator.html) 참조.)

---

## 5.7 `sorted`, `reversed`, `enumerate`, `zip` — 빌딩 블록

이들은 “*reducer*” 라고 부르기는 어렵지만, *iterable 을 받아 다른 iterable 을 만든다* 는 점에서 같은 카테고리에서 자주 함께 다뤄진다. 이들을 “*iterator 빌딩 블록*” 이라 부른다.

* `sorted(iterable, key=None, reverse=False)` — 정렬된 *list* 를 반환.
* `reversed(seq)` — 역방향 *iterator* 를 반환 (시퀀스 한정).
* `enumerate(iterable, start=0)` — `(index, value)` 의 *iterator* 를 반환.
* `zip(iter1, iter2, ...)` — *튜플* 의 *iterator* 를 반환. *짧은 쪽* 기준.

```python
sorted([3, 1, 2])                          # [1, 2, 3]
list(reversed([1, 2, 3]))                  # [3, 2, 1]
list(enumerate('abc'))                     # [(0, 'a'), (1, 'b'), (2, 'c')]
list(zip([1, 2, 3], 'abc'))                # [(1, 'a'), (2, 'b'), (3, 'c')]
```

이들 모두 *iterable* 을 받아 *iterator* 또는 *list* 를 반환한다. *iterator 빌딩 블록* 의 *합성* 에 사용된다.

---

## 5.8 “*Modern Replacements for map, filter, and reduce*” 의 최종 요약

[*Fluent Python* 7 장 “Modern Replacements for map, filter, and reduce”](https://www.fluentpython.com/) 가 권장하는 *최종 요지* 는 다음과 같다.

1. `map(func, iter)` → *iterator* 가 필요하면 `map`, *list* 가 필요하면 **리스트 컴프리헨션** `[func(x) for x in iter]`.
2. `filter(func, iter)` → *iterator* 가 필요하면 `filter`, *list* 가 필요하면 **`[x for x in iter if func(x)]`**.
3. `reduce(func, iter, init)` → **`sum(iter, init)`, `any(iter)`, `all(iter)`, `min(iter, ...)`, `max(iter, ...)`** 중 가장 잘 맞는 *built-in* 으로 대체. 안 되면 `functools.reduce` 로 *임의의 누적 함수* 적용.
4. `lambda` → `operator` 모듈의 *itemgetter, attrgetter, methodcaller, mul, add* 등으로 대체.
5. *partial application* → `functools.partial` 로 *인자 고정* 의 *callable* 만들기.

이 5개 원칙만 기억해도 “*고전 함수형* → *현대적 파이썬*” 의 매핑이 거의 자동으로 된다.

---

## 5.9 “*reducer*” 와 “*iterator*” 의 만남

`sum`, `min`, `max`, `any`, `all` 같은 *built-in reducer* 는 모두 *iterator* 를 받아 한 번에 처리한다. 따라서 *iterator* 의 *게으름* 과 *단축 평가* 가 자연스럽게 적용된다.

* `any` / `all` 의 *단축 평가* 는 *iterator* 의 *게으름* 으로 *필요한 만큼만 본다* 로 이어진다.
* `sum` 은 *iterator* 를 한 번 패스한다. *제너레이터 표현식* 과 결합하면 “*전체 리스트* + *합”* 의 메모리 부담을 “*단일 값 + 현재 누적”* 로 줄인다.
* `min` / `max` 는 *iterator* 를 한 번 패스하면서 *현재까지의 최소/최대* 만 유지한다. *메모리* 에는 *iterator 의 진행 상태* + *현재 최소/최대* 만 산다.

```python
# 큰 파일에서 가장 큰 줄
max(open('big.txt'), key=len)
```

이 표현은 *open* 의 *iterator* 와 `max` 의 *key=* 가 만나 “*메모리에는 한 줄 + 가장 긴 줄의 길이*” 만 살게 한다. 같은 일을 *for + sort* 로 풀면 *모든 줄을 리스트에 올린 뒤* 정렬해야 한다. *iterator + reducer* 의 조합이 압도적으로 가볍다.

### 5.9.1 *reducer* 들은 모두 “*입력 iterable* + *단일 출력*”

* `sum` — 합계
* `min` / `max` — 최솟값 / 최댓값
* `any` / `all` — 진리값 누적
* `reduce` — 임의의 누적
* `len` — 길이 (단, `__len__` 구현 객체 한정)

*Python Performance Tips* 와 [itertools 레시피](https://docs.python.org/3/library/itertools.html) 가 보여 주듯, 이 *reducer* 들을 잘 조합하면 *어떤 함수형 라이브러리* 못지않은 표현력을 얻을 수 있다.

---

## 5.10 흔한 실수와 미묘한 버그

### 5.10.1 “`sum` 으로 문자열 결합”

`sum(['a', 'b', 'c'], '')` 는 동작하지만 `O(n^2)` 다. `''.join(...)` 은 `O(n)` 이다. *문자열 결합* 은 항상 `join` 을 쓴다.

```python
sum(['a', 'b', 'c'], '')            # 'abc' (느림)
''.join(['a', 'b', 'c'])            # 'abc' (빠름)
```

### 5.10.2 “`any`/`all` 의 진리값 강제 변환”

`any([1, 'a', [1]])` 는 모두 truthy 다. `bool(x)` 가 어떻게 평가되는지 헷갈리면 *예상치 못한 결과* 가 나온다. 특히 `0`, `''`, `None`, `[]`, `{}`, `()` 은 falsy 다. 나머지는 거의 모두 truthy 다.

### 5.10.3 “`reduce` 의 *initializer* 없는 빈 iterator”

```python
reduce(lambda a, b: a + b, [], 0)         # 0   ← 안전
reduce(lambda a, b: a + b, [])            # TypeError
```

*iterator* 가 *비어 있을 수 있다* 면 *initializer* 를 항상 주어야 한다.

### 5.10.4 “`min`/`max` 의 *default* 없이 빈 iterator”

```python
min(it)              # ValueError: min() arg is an empty sequence
min(it, default=None)        # None
```

`min` / `max` 도 *default* 가 없으면 *빈 iterable* 에서 `ValueError` 다.

### 5.10.5 “`len` 을 *iterator* 에 사용”

```python
len(iter([1, 2, 3]))        # TypeError
```

*iterator* 는 *길이를 모른다*. *iterator 의 길이* 를 알기 위해서는 *전부 소비* 해야 한다 (`sum(1 for _ in it)`). *iterator 의 게으름* 과 *길이* 는 *본질적으로 모순* 한다.

### 5.10.6 “`map` + *lambda* + *여러 iterable*”

```python
list(map(lambda x, y, z: x + y + z, [1, 2], [10, 20], [100, 200]))
# [111, 222]
```

*map* 은 *여러 iterable* 을 받아 *function* 의 인자 수와 맞춘다. *짧은 쪽* 기준이 아니라, *길이가 다른 iterable* 을 받으면 *짧은 쪽* 만큼만 진행한다. `zip` 과 동일하다.

### 5.10.7 “`filter(None, ...)` 의 *truthy* 검사”

```python
list(filter(None, [0, 1, '', 'a', None, [1], []]))     # [1, 'a', [1]]
```

`None` 함수 인자는 *truthy* 만 통과시킨다. `bool(item)` 을 통과시키는 것과 같다. *0, '', None, [], {}, (), False* 는 모두 falsy 다.

### 5.10.8 “`sorted` 와 `reverse`”

`sorted` 는 *list* 를 반환한다. *iterator* 가 아니라 *즉시 materialize* 다. 메모리 부담이 크면 *heapq* 모듈을 고려한다.

```python
import heapq
smallest_three = heapq.nsmallest(3, nums)         # 가장 작은 3개
```

`heapq.nsmallest(n, iterable)` 는 *힙* 을 사용해 *전체 정렬* 없이 *상위 n개* 만 얻는다. 큰 iterable 에 적합하다.

---

## 5.11 “*reducer*” 의 실전 예제

### 5.11.1 “*큰 텍스트에서 가장 긴 줄*”

```python
with open('big.txt') as f:
    longest = max(f, key=len)
```

*iterator* 인 `f` 를 `max` 의 *iterable* 로 직접 전달. *key=* 로 길이 비교. *메모리* 에는 *현재까지의 가장 긴 줄* 만 산다.

### 5.11.2 “*모든 페이지의 총 방문자*”

```python
from operator import itemgetter
total = sum(map(itemgetter('visits'), page_stats))
```

*itemgetter* 로 *lambda* 대체. `map` 의 *iterator* 성질을 활용.

### 5.11.3 “*하나라도 에러 메시지가 있는가?*”

```python
if any('error' in line.lower() for line in log_lines):
    notify()
```

*iterator* 의 *게으름* + `any` 의 *단축 평가*. *에러* 발견 즉시 `True`.

### 5.11.4 “*모든 사용자가 활성인가?*”

```python
if not all(user['active'] for user in users):
    warn()
```

*iterator* + `all`. *비활성 사용자* 발견 즉시 `False`.

### 5.11.5 “*정수 시퀀스의 곱*”

```python
from functools import reduce
from operator import mul
product = reduce(mul, integers, 1)
```

`sum` 같은 *built-in* 으로 대체 불가능하므로 `reduce` + `mul`.

### 5.11.6 “*중복 없는 가장 큰 항목*”

```python
max(set(items), key=items.count)
```

`set` 으로 *중복 제거* 후 *원본의 빈도* 로 비교. `Counter` 모듈을 쓰면 더 간결해진다.

```python
from collections import Counter
Counter(items).most_common(1)
```

### 5.11.7 “*단어 빈도 사전*”

```python
from collections import Counter
counts = Counter(word for line in file for word in line.split())
```

*iterator* (제너레이터 표현식) + `Counter` 의 *reducer*. 한 번의 패스로 *빈도 사전* 작성.

### 5.11.8 “*카운팅 가능한 iterable*”

```python
def n_items(iterable):
    return sum(1 for _ in iterable)
```

*iterator* 의 *길이* 를 모를 때 *iterable 의 항목 수* 를 센다. (`len(list(it))` 보다 *메모리* 가 가볍다.)

---

## 5.12 “*reducer*” 와 “*표준 라이브러리*” 의 만남

*reducer* 들은 표준 라이브러리의 거의 모든 *iterator 빌딩 블록* 과 *합성* 된다.

```python
# csv.reader 의 각 행에서 'amount' 컬럼의 합
import csv
from operator import itemgetter

with open('transactions.csv') as f:
    rows = csv.DictReader(f)
    total = sum(map(itemgetter('amount'), rows))
```

*csv.DictReader* (iterator of dict) + `map(itemgetter, ...)` + `sum`. 세 *iterator 빌딩 블록* 의 합성.

```python
# os.walk 로 .py 파일 개수 세기
import os
from itertools import starmap

count = sum(starmap(lambda d, _, fs: sum(1 for f in fs if f.endswith('.py')), os.walk('.')))
```

`os.walk` (iterator of (dirpath, dirnames, filenames)) + `starmap` (function of 3 args) + `sum`. 합성의 끝을 보여 주는 예.

---

## 5.13 `operator` 모듈과 `functools.partial` 의 결합

`operator` 모듈은 *연산자* 를 *callable* 로 만든다. `functools.partial` 은 *callable* 의 일부 인자를 고정한다. 둘을 결합하면 *고성능 합성* 이 가능하다.

```python
from operator import itemgetter, methodcaller
from functools import partial

# 모든 dict 의 'name' 키 값 추출
list(map(itemgetter('name'), users))                              # [u1, u2, ...]

# 모든 string 의 strip 적용
list(map(methodcaller('strip'), lines))

# 정렬 키: (이름 길이, 이름)
sorted(users, key=lambda u: (len(u['name']), u['name']))          # lambda
sorted(users, key=itemgetter('name'), reverse=False)               # 단순
```

*operator* 모듈의 자세한 사용법은 [공식 문서](https://docs.python.org/3/library/operator.html) 에 잘 정리돼 있다.

---

## 5.14 정리

| 함수 | 의미 | 시그니처 | 비고 |
| --- | --- | --- | --- |
| `sum` | iterable 의 합 + start | `(iterable, start=0)` | *iterator* 친화 |
| `min` / `max` | 최솟값 / 최댓값 | `(iterable, key=None, default=...)` | *iterator* 한 번 패스 |
| `any` | truthy 가 있나? | `(iterable)` | *단축 평가* |
| `all` | 모두 truthy 인가? | `(iterable)` | *단축 평가* |
| `len` | 길이 | `(obj)` | `__len__` 구현 객체 한정 |
| `functools.reduce` | 임의의 누적 | `(func, iterable, init=None)` | *iterator* 친화 |
| `itertools.accumulate` | 중간 결과 모두 | `(iterable, func=op.add)` | *iterator* 반환 |
| `map` | 함수 적용 | `(func, iter, ...)` | 3.x 는 *iterator* |
| `filter` | 조건 필터 | `(func_or_None, iter)` | 3.x 는 *iterator* |

### 한 줄 요약

> **“reducing functions 은 iterable 의 단일 결과를 만든다. `sum`, `min`, `max`, `any`, `all` 은 built-in 으로 즉시 답을 주고, `functools.reduce` 는 임의의 누적 함수로 확장한다. *map*/*filter* 는 *iterator 빌딩 블록* 이지만, 컴프리헨션/제너레이터 표현식이 더 가독성이 좋다. iterator 와 만나면 *게으름*, *단축 평가*, *합성 가능성* 이 한꺼번에 살아난다.”**

---

## 5.15 연습 문제

1. **`sum` vs `join`**: 1,000,000개의 단어로 이루어진 리스트를 합치는 두 가지 방법의 시간을 `timeit` 으로 비교하라. `sum` 이 왜 더 느린지 설명하라.

2. **`any` 의 단축 평가 확인**: 1,000,000개의 항목 중 “*5번째 항목이 ‘END’*” 인 경우, `any` 가 실제로 5번째까지만 본다는 것을 *side effect* 가 있는 함수로 확인하라.

3. **`reduce` vs `accumulate`**: 1, 2, 3, 4 의 누적 결과를 *reduce* 와 *accumulate* 로 각각 만들어 보고, 결과의 차이를 설명하라.

4. **`operator.itemgetter` vs `lambda`**: `users = [{'age': 30}, {'age': 25}, ...]` 에서 가장 어린 사용자를 찾는 두 가지 코드를 작성하라. *lambda* 와 `itemgetter` 의 *속도* 차이를 측정하라.

5. **`map` + `filter` vs 컴프리헨션**: 다음을 *map* + *filter* 와 컴프리헨션으로 각각 작성하고 가독성을 비교하라.
   * “*1부터 10까지의 짝수의 제곱*”

6. **`len` 의 비대칭**: 다음 객체들 각각에 `len` 을 적용해 보고, 왜 *iterator* 는 `len` 이 안 되는지 설명하라.
   * `list`, `tuple`, `dict`, `set`, `str`, `range`, `iter([])`, `iter([1, 2])`, `zip([], [])`, `enumerate([])`.

7. **`functools.reduce` 로 임의의 누적 함수 만들기**: *CSV 의 모든 행을 누적* 해 *특정 키* 의 *running total* 을 만드는 함수를 `reduce` 로 작성하라.

8. **`itertools.accumulate` 로 running average**: 1, 2, 3, 4, 5 의 *running average* 를 `accumulate` 와 *제너레이터 표현식* 으로 작성하라.

---

## 5.16 더 읽을 거리

* [`sum`, `min`, `max`, `any`, `all` — Built-in Functions](https://docs.python.org/3/library/functions.html)
* [`functools.reduce`](https://docs.python.org/3/library/functools.html#functools.reduce)
* [`operator` 모듈](https://docs.python.org/3/library/operator.html)
* [`itertools.accumulate`](https://docs.python.org/3/library/itertools.html#itertools.accumulate)
* [PEP 289 – Generator Expressions](https://peps.python.org/pep-0289/)
* [Haskell — foldl, foldr](https://www.haskell.org/)
* Fluent Python 2/E — Chapter 7 “Modern Replacements for map, filter, and reduce”, Chapter 17 “Iterable Reducing Functions”

---

### 정리

이번 섹션의 핵심을 한 문장으로 다시 적는다.

> **“reducing functions 은 iterable 의 단일 결과를 만든다. `sum`, `min`, `max`, `any`, `all` 의 built-in 5종이 일반적 케이스를 커버하고, `functools.reduce` 가 나머지를 맡는다. `map` / `filter` 는 *iterator 빌딩 블록* 으로 여전히 유효하지만, 컴프리헨션/제너레이터 표현식이 더 자주 권장된다.”**

다음 섹션에서는 이 모든 빌딩 블록 위에 **`yield from`** 이라는 *합성 구문* 을 얹고, *서브 제너레이터 위임*, *트리 순회*, *코루틴* 으로 확장한다.
# 섹션 6. Subgenerators with `yield from` — `chain` 재구현, 트리 순회, 클래식 코루틴

> *Fluent Python 2/E · Chapter 17* 의 “Subgenerators with yield from”, “Reinventing chain”, “Traversing a Tree”, “Classic Coroutines” 에 대응하는 학습 노트.
>
> 참고: [PEP 380 – Syntax for Delegating to a Subgenerator](https://peps.python.org/pep-0380/), [PEP 342 – Coroutines via Enhanced Generators](https://peps.python.org/pep-0342/), [PEP 492 – Coroutines with async and await syntax](https://peps.python.org/pep-0492/), [`asyncio`](https://docs.python.org/3/library/asyncio.html), [`types.GeneratorType`](https://docs.python.org/3/library/types.html#types.GeneratorType), [`inspect.getgeneratorstate`](https://docs.python.org/3/library/inspect.html#inspect.getgeneratorstate), [`typing.Generator`, `typing.AsyncGenerator`](https://docs.python.org/3/library/typing.html).

---

## 6.0 도입: “서브 제너레이터에게 위임” 이라는 아이디어

지금까지 우리는 *하나의 제너레이터 함수* 가 *직접* `yield` 로 값을 내보내는 패턴만 봤다. 그런데 실무에서는 “*한 제너레이터가 다른 제너레이터에게 작업을 위임*” 하는 일이 매우 흔하다.

* **여러 iterable 을 차례로 이어 붙이고 싶다** — `itertools.chain` 의 본질.
* **트리를 깊이 우선으로 순회하고 싶다** — 재귀 호출마다 *자식 노드* 에 대한 *제너레이터* 를 만들고, 부모가 *자식 제너레이터* 의 결과를 그대로 외부에 yield.
* **파이프라인의 각 단계를 별도 제너레이터로 정의하고 싶다** — 데이터 흐름을 함수 단위로 분리.

이 모든 패턴을 *명시적* 으로 작성하면 `for x in sub: yield x` 같은 *wrapper 코드* 가 반복된다. `yield from` 은 이 *wrapper 코드* 를 한 줄로 압축하는 *syntax sugar* 이다. *단순한 syntactic sugar* 가 아니라, **세 가지 의미** 를 동시에 가진다.

1. **위임 (delegation)**: 하위 iterable 의 값을 그대로 상위로 yield.
2. **양방향 통신 (channel)**: 상위에서 보낸 `send`/`throw` 가 하위로 전달되고, 하위의 `return` 값이 상위로 전달된다.
3. **생명 주기 관리 (lifecycle)**: 하위 제너레이터의 `close()` 가 상위에서 자동으로 호출된다.

[PEP 380 – Syntax for Delegating to a Subgenerator](https://peps.python.org/pep-0380/) 가 이 세 가지 의미를 정의한다. 이 절에서는 그 의미를 차근차근 풀어 본다.

---

## 6.1 `yield from` 의 기본 의미: 위임

### 6.1.1 `for ... yield` 의 wrapper

다음 두 코드는 의미상 거의 같다.

```python
# (1) for + yield
def chain(*iterables):
    for it in iterables:
        for item in it:
            yield item

# (2) yield from
def chain(*iterables):
    for it in iterables:
        yield from it
```

`yield from it` 은 `it` 이 *iterator* 일 때, *그 iterator 가 yield 하는 모든 값을 그대로* 외부에 전달한다. 즉, *현재 제너레이터* 의 *본문* 이 *일시 정지* 했다가, *서브 iterator* 가 진행되는 동안 *그 결과* 만 *외부* 에 yield 한다. 서브 iterator 가 `StopIteration` 으로 끝나면, *현재 제너레이터* 가 다시 진행한다.

### 6.1.2 정확한 의미

PEP 380 의 “*Specification: Semantics*” 단락은 `yield from <expr>` 을 *다음 의사 코드* 로 정의한다.

```text
RESULT = yield from EXPR
# 위 코드는 다음과 동치:
_i = iter(EXPR)               # 1) EXPR 을 iter 한다
try:
    _y = next(_i)              # 2) 첫 항목을 미리 받아 진행
except StopIteration as _e:
    _r = _e.value              # 3) 서브 iterator 의 return 값을 받음
else:
    while True:
        _s = yield _y          # 4) 외부에서 값이 들어올 때 까지 _y 를 외부에 yield
        try:
            _y = _i.send(_s)   # 5) 서브 iterator 에 _s 를 보냄
        except StopIteration as _e:
            _r = _e.value      # 6) 서브 iterator 의 return 값
            break
RESULT = _r
```

이 의사 코드는 “*외부 ↔ 서브 iterator*” 사이의 양방향 통신을 보여 준다. 단순한 wrapper 가 아니라, *양방향 채널* 다.

### 6.1.3 “위임” 의 두 가지 측면

* **값의 위임**: 서브 iterator 의 yield 값을 외부에 그대로 전달.
* **제어의 위임**: 외부에서 들어오는 `send`, `throw`, `close` 도 서브 iterator 에게 전달.

따라서 `yield from` 은 *현재 제너레이터* 가 *“통과”* 만 하는 *투명한 채널* 처럼 동작한다. *현재 제너레이터* 가 추가적인 일을 하지 않는 한, 외부와 서브 iterator 는 직접 대화하는 것처럼 보인다. *투명성* 이 `yield from` 의 본질이다.

---

## 6.2 `Reinventing chain` — `itertools.chain` 직접 구현

`itertools.chain` 의 본질은 “*여러 iterable 을 차례로 이어붙인다*”. 이걸 `yield from` 으로 직접 구현하면 다음과 같다.

```python
def chain(*iterables):
    for it in iterables:
        yield from it
```

이 한 줄짜리 함수로 *itertools.chain* 의 핵심 기능을 구현할 수 있다. `for it in iterables: yield from it` 의 의미는 “*iterables 의 각 iterable 에 대해, 그 iterable 이 yield 하는 모든 값을 그대로 외부에 yield*”. 정확히 `itertools.chain` 의 의미다.

### 6.2.1 사용 예

```python
list(chain([1, 2], [3, 4, 5], (6,)))            # [1, 2, 3, 4, 5, 6]
list(chain('abc', range(3)))                    # ['a', 'b', 'c', 0, 1, 2]
```

### 6.2.2 표준 라이브러리와의 차이

표준 라이브러리 `itertools.chain` 은 C 로 구현되어 더 빠르다. 사용 목적에 따라 둘 중 하나를 골라 쓰면 된다. *교육 목적* 또는 *커스터마이즈* 가 필요하면 직접 구현이 더 직관적이다. *고성능* 이 필요하면 `itertools.chain` 을 그대로 쓰면 된다.

### 6.2.3 `chain.from_iterable`

`itertools.chain.from_iterable(iterable_of_iterables)` 는 *iterable 의 iterable* 을 받아 *하나로 합친* iterator 를 만든다. 다음 코드와 동치다.

```python
def from_iterable(iterables):
    for it in iterables:
        yield from it
```

사용 예:

```python
list(chain.from_iterable([[1, 2], [3, 4], [5]]))    # [1, 2, 3, 4, 5]
```

*제너레이터* 또는 *제너레이터 표현식* 과 결합하면 *게으름* 도 그대로 유지된다.

### 6.2.4 “*투명성*” 의 예: yield from 의 return 값

```python
def sub():
    yield 1
    yield 2
    return 'sub_done'

def main():
    result = yield from sub()
    print('sub result:', result)

list(main())                # [1, 2]
# 출력: sub result: sub_done
```

`yield from sub()` 의 결과는 *서브 제너레이터* 의 *return 값* 이다. *서브 제너레이터* 가 `return 'sub_done'` 으로 끝나면, *메인 제너레이터* 의 `result` 에 `'sub_done'` 이 들어온다. 이 기능은 *파이프라인의 합성* 에 자주 쓰인다.

*주의*: `return` 의 *값* 은 외부에서는 *보이지 않는다* (외부에서 `next(g)` 의 결과로 받지 못한다). 다만 `yield from` 의 *값* 으로는 받을 수 있다. 이 비대칭은 PEP 380 의 “*Specification: Return value*” 단락에 명시돼 있다.

---

## 6.3 `Traversing a Tree` — 재귀적 트리 순회

`yield from` 의 가장 강력한 응용 중 하나는 *재귀적 트리 순회* 다. 각 노드가 *자식 노드들의 iterable* 을 갖는 *트리* 를 깊이 우선으로 순회하면서, *모든 잎* 을 *하나씩* yield 한다.

### 6.3.1 트리 자료 구조

```python
class Tree:
    def __init__(self, label, *children):
        self.label = label
        self.children = list(children)

    def __repr__(self):
        return f'Tree({self.label!r}, {self.children!r})'
```

예:

```python
t = Tree(
    'root',
    Tree('a',
         Tree('a1'),
         Tree('a2')),
    Tree('b'),
    Tree('c',
         Tree('c1'))
)
```

### 6.3.2 재귀적 yield

```python
def inorder(t):
    """전위 순회: 부모 - 자식들"""
    yield t.label
    for child in t.children:
        yield from inorder(child)
```

`inorder(t)` 는 `t.label` 을 yield 한 뒤, 각 *자식* 에 대해 *재귀적으로* `inorder(child)` 를 호출한다. `yield from` 으로 *서브 제너레이터* 의 모든 yield 값을 그대로 외부에 전달한다.

```python
list(inorder(t))
# ['root', 'a', 'a1', 'a2', 'b', 'c', 'c1']
```

*iterator* 의 *게으름* 덕분에, 트리가 거대해도 *현재 yield 된 노드* 와 *재귀 호출 스택* 만 메모리에 산다. *list 로 materialize* 하지 않아도 *한 번에 하나씩* 진행할 수 있다.

### 6.3.3 `yield from` 없이 작성한 트리 순회

`yield from` 없이 작성하면 다음과 같다.

```python
def inorder_no_yield_from(t):
    yield t.label
    for child in t.children:
        for x in inorder_no_yield_from(child):
            yield x
```

*중첩 for* 가 한 단계 더 들어간다. `yield from` 은 이 *중첩 for* 의 syntactic sugar 다. *양방향 통신* 까지 고려하면, `yield from` 은 *단순 wrapper* 이상이다.

### 6.3.4 깊이 제한, 필터, 후위 순회

*깊이 제한*:

```python
def inorder_depth(t, max_depth, current=0):
    if current > max_depth:
        return
    yield t.label
    for child in t.children:
        yield from inorder_depth(child, max_depth, current + 1)
```

*필터*:

```python
def even_labels(t):
    yield t.label if t.label % 2 == 0 else None
    for child in t.children:
        yield from even_labels(child)
```

*후위 순회*:

```python
def postorder(t):
    for child in t.children:
        yield from postorder(child)
    yield t.label
```

*트리 순회* 의 *재귀적 yield from* 패턴은 매우 강력하다. 단순히 *자식 노드의 iterable* 이 *제너레이터* 인 한, *어떤 트리* 든 *한 줄* 의 `yield from` 으로 깊이 우선 순회가 가능하다.

### 6.3.5 비트리 (그래프, 상호참조) 의 경우

*그래프* 에서 *순환* 이 있으면 *무한 루프* 가 생긴다. *방문한 노드 집합* 을 유지하고, *이미 방문한 노드는 건너뛰는* 로직을 추가해야 한다.

```python
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    if start in visited:
        return
    visited.add(start)
    yield start
    for nxt in graph[start]:
        yield from dfs(graph, nxt, visited)
```

이 패턴은 *재귀 + yield from + 명시적 visited* 의 결합이다.

---

## 6.4 `yield from` 의 양방향 통신

이제 PEP 380 의 진짜 위력을 살펴본다. `yield from` 은 *서브 제너레이터* 와 *외부* 사이의 *투명한 채널* 이다. *외부* 에서 `g.send(x)` 를 호출하면, *x* 는 *서브 제너레이터* 의 *현재 yield 위치* 로 전달된다. 서브 제너레이터의 `return` 값은 *yield from 의 결과* 로 *메인 제너레이터* 에 전달된다.

### 6.4.1 “투명한 채널” 의 정확한 의미

```python
def sub():
    value = yield 'ready'
    while True:
        value = yield f'echo {value}'

def main():
    yield from sub()
```

이 `main` 은 *외부* 와 직접 대화하는 *서브 제너레이터* 처럼 보인다. 외부에서 `next(g)`, `g.send(x)`, `g.throw(...)`, `g.close()` 를 호출하면 그 결과는 *서브 제너레이터* 에게 그대로 전달된다.

```python
g = main()
next(g)                        # 'ready'   (서브가 처음 yield)
g.send('hello')                # 'echo hello'
g.send('world')                # 'echo world'
g.close()
```

*메인 제너레이터* 가 추가 작업을 하지 않기 때문에, *투명성* 이 완전히 발휘된다. *메인 제너레이터* 가 *서브 제너레이터* 의 yield 값을 변형한다면, *변형된* 값이 외부로 전달된다. 이 사실은 *파이프라인* 의 *중간 단계* 를 작성할 때 매우 중요하다.

### 6.4.2 `send` 의 `None` 강제

서브 제너레이터가 *아직 시작되지 않은* 상태에서 외부에서 `g.send(10)` 을 호출하면, 첫 `send` 가 *서브 제너레이터* 의 *시작* 까지 진행해야 하는데, *서브 제너레이터* 의 *첫 yield* 가 *value 받을 준비* 가 되어 있어야 한다. *메인 제너레이터* 가 *아무 작업도 하지 않으므로* (즉 *시작* 시 `send(None)` 만 필요하다면) *서브 제너레이터* 가 그 일을 한다.

```python
def sub():
    value = yield 'ready'      # 서브는 여기서 외부 값을 기다림

g = sub()
g.send(10)                     # TypeError: can't send non-None value to a just-started generator
```

해결책: `next(g)` 또는 `g.send(None)` 으로 시작.

```python
g = sub()
next(g)                        # 'ready'
g.send(10)                     # 'echo 10'
```

이 사실은 *섹션 3* 에서 이미 다뤘다. *yield from* 의 *투명성* 도 *이 규칙* 을 그대로 따른다.

### 6.4.3 `throw` 와 `close` 의 위임

`g.throw(exc_type, value, traceback)` 는 *서브 제너레이터* 의 *현재 yield 위치* 에 *예외* 를 던진다. 서브가 그 예외를 잡으면 *재개* 되고, 잡지 않으면 *메인 제너레이터* 로 예외가 전파된다.

`g.close()` 는 `GeneratorExit` 예외를 *서브 제너레이터* 에게 던진다. 서브는 보통 *정상 종료* 하거나, 자원 정리(파일 닫기 등) 를 한다.

이 *자동 위임* 덕분에 *메인 제너레이터* 가 *서브 제너레이터* 의 *자원 관리* 를 책임지지 않아도 된다.

---

## 6.5 클래식 코루틴 (Classic Coroutines) — 제너레이터의 다른 얼굴

[PEP 342 – Coroutines via Enhanced Generators](https://peps.python.org/pep-0342/) 부터, *제너레이터* 가 *값을 yield* 하는 동시에 *외부에서 값을 받는다* (`send`) 는 *양방향* 의미가 공식 지원된다. 이런 사용 패턴을 *클래식 코루틴(classic coroutine)* 이라 부른다. (Python 3.5 부터 도입된 *네이티브 코루틴* `async def` 와 구분하기 위한 이름이다.)

### 6.5.1 클래식 코루틴의 기본 형태

```python
def averager():
    total = 0.0
    count = 0
    average = None
    while True:
        term = yield average     # 외부에서 보낸 값
        total += term
        count += 1
        average = total / count
```

이 함수는 *제너레이터 함수* 다. 본문에 `yield` 가 있으므로 호출하면 *제너레이터 객체* 가 반환된다. 그 *제너레이터 객체* 는 *iterator* 이자 *코루틴* 이다.

```python
coro = averager()
next(coro)                  # None  (코루틴 시작, average 초기값은 None)
coro.send(10)               # 10.0
coro.send(20)               # 15.0
coro.send(30)               # 20.0
```

*iterable/iterator* 의 관점에서는, 이 *제너레이터 객체* 는 *iterator* 다. `next(coro)` 를 호출할 때마다 *다음 yield* 까지 진행한다. *코루틴* 의 관점에서는, *외부* 가 `coro.send(x)` 로 *값* 을 보낼 수 있다. 그 *값* 은 *현재 yield 의 결과* 로 *term* 에 들어간다.

### 6.5.2 “Running Average” 예제의 의미

`averager` 는 *running average* (누적 평균) 를 유지한다. 매 `send(x)` 마다 *현재까지의 평균* 을 *average* 로서 *외부* 에 yield 한다. 이 패턴은 *스트림 데이터* 의 *온라인 평균* 에 자주 쓰인다.

*주의*: 첫 호출은 *반드시* `next(coro)` 또는 `coro.send(None)` 이어야 한다. `coro.send(10)` 을 *첫 호출* 로 두면 `TypeError: can't send non-None value to a just-started generator` 다. 이 규칙은 *모든 제너레이터* 에 적용된다.

### 6.5.3 “*Returning a Value from a Coroutine*”

PEP 380 부터, *제너레이터 함수* 가 *값을 return* 할 수 있다. 그 값은 `StopIteration.value` 에 저장된다. 외부에서 *그 값을 직접* 받는 방법은 *단순 `next`* 로는 안 된다. *try/except StopIteration* 으로 잡아야 한다. *yield from* 의 *결과* 로는 자연스럽게 받을 수 있다 (이전 6.2.4 절).

```python
def averager_with_return():
    total = 0.0
    count = 0
    average = None
    while True:
        term = yield average
        if term is None:
            return count, average    # 종료 시 결과 반환
        total += term
        count += 1
        average = total / count
```

이 패턴은 *종료 시 결과 정리* 가 필요할 때 쓰인다. *외부* 에서 `coro.close()` 후 `try/except StopIteration` 으로 결과를 받을 수 있다.

### 6.5.4 “Generic Type Hints for Classic Coroutines”

`typing.Generator[YieldType, SendType, ReturnType]` 가 *제너레이터* 의 *yield/send/return* 타입을 명시한다. *클래식 코루틴* 은 보통 `Generator[YieldType, SendType, ReturnType]` 으로 표시한다.

```python
from typing import Generator

def averager() -> Generator[float, float, None]:
    total = 0.0
    count = 0
    average = None
    while True:
        term: float = yield average
        total += term
        count += 1
        average = total / count
```

*YieldType = float*, *SendType = float*, *ReturnType = None* (이 코루틴은 *무한히* 진행하므로 `return` 값이 없음).

*Fluent Python* 17 장은 이 *제네릭 타입* 의 의미를 자세히 설명한다. *제너레이터의 yield/send/return 타입* 은 *제너레이터 객체의 행동 계약* 이라고 부를 수 있다.

### 6.5.5 `inspect.getgeneratorstate` 와 디버깅

*클래식 코루틴* 의 *현재 상태* 는 `inspect.getgeneratorstate(coro)` 로 확인할 수 있다. 반환값은 다음 중 하나다.

* `'GEN_CREATED'` — 생성됐지만 시작 안 됨.
* `'GEN_RUNNING'` — 현재 실행 중.
* `'GEN_SUSPENDED'` — `yield` 에서 일시 정지.
* `'GEN_CLOSED'` — 종료됨.

이 정보는 *디버깅* 에 매우 유용하다. *코루틴이 어디에 멈춰 있는지* 를 알 수 있다.

```python
import inspect
coro = averager()
inspect.getgeneratorstate(coro)        # 'GEN_CREATED'
next(coro)
inspect.getgeneratorstate(coro)        # 'GEN_SUSPENDED'
coro.send(10)
inspect.getgeneratorstate(coro)        # 'GEN_SUSPENDED'
coro.close()
inspect.getgeneratorstate(coro)        # 'GEN_CLOSED'
```

### 6.5.6 클래식 코루틴의 한계

[PEP 492 – Coroutines with async and await syntax](https://peps.python.org/pep-0492/) 가 도입된 이후, *클래식 코루틴* 은 “*legacy*” 라고 불린다. *asyncio* 의 *네이티브 코루틴* `async def` 가 *표준* 이다. 클래식 코루틴이 여전히 쓰이는 이유는:

* `asyncio` 이전 라이브러리 호환.
* *단순한 양방향 통신* 의 *간단한 패턴* 으로 충분한 경우.
* *제너레이터/이터레이터와 코루틴의 경계를 학습* 하기 위한 출발점.

다만 *복잡한 비동기 제어* (예: 다수의 코루틴 조정, *이벤트 루프* 통합) 는 *네이티브 코루틴* 으로 옮겨가는 게 정답이다. 21 장에서 *async def* / `await` 의 진수에 가깝게 다룬다.

---

## 6.6 `yield from` 의 동작 요약 — 다섯 가지 사실

`yield from` 의 정확한 동작을 다섯 가지 사실로 정리한다.

1. **위임의 시작**: `yield from <expr>` 의 `<expr>` 은 *iterable* 일 수도, *iterator* 일 수도 있다. *iterable* 이면 자동으로 `iter()` 가 호출된다.
2. **값의 양방향 전달**: 외부에서 들어오는 *send/throw* 는 *서브 iterator* 에게 그대로 전달된다. 서브의 *yield 값* 은 *외부* 로 그대로 전달된다. *메인 제너레이터* 가 추가 작업을 하지 않는 한, *투명한 채널* 이다.
3. **return 값의 전달**: 서브 제너레이터의 `return` 값은 *메인 제너레이터* 의 *yield from 의 결과* 로 들어온다. 즉, `result = yield from sub()` 의 `result` 에 저장된다.
4. **생명 주기의 자동 관리**: `g.close()` 가 호출되면 *서브 제너레이터* 의 `close()` 도 자동으로 호출된다. 자원 정리가 자동으로 전파된다.
5. **에러의 양방향 전파**: 서브 제너레이터가 *잡지 않은 예외* 를 일으키면 *메인* 으로 *메인이 잡지 않은 예외* 는 *외부* 로 전파된다. 예외는 양방향 모두에서 자연스럽게 흐른다.

이 다섯 가지가 PEP 380 의 “*Specification*” 단락에 명시되어 있다.

---

## 6.7 “서브 제너레이터” 의 합성 패턴

### 6.7.1 “파이프라인” 패턴

`yield from` 은 *파이프라인* 의 *중간 단계* 를 정의할 때 자주 쓰인다. 각 단계가 *서브 제너레이터* 에게 위임하고, *필요한 변환* 만 *메인 제너레이터* 가 한다.

```python
def pipeline():
    yield from stage1()
    yield from stage2()
    yield from stage3()
```

하지만 이 패턴은 *단계 간 데이터 변환* 이 없을 때만 의미가 있다. *변환* 이 있다면, *메인 제너레이터* 가 *for + yield* 또는 *제너레이터 표현식* 으로 데이터를 변형한다.

```python
def upper_pipeline():
    for line in stage1():
        yield line.upper()
```

이 경우 *stage1* 의 *iterator* 가 *메인의 `for`* 안에서 진행되고, *메인이* `line.upper()` 로 *변환* 한 뒤 *외부* 에 yield 한다. *yield from* 이 *필요 없다*. *yield from* 이 빛을 발하는 때는 *“여러 단계의 iterator 를 차례로 yield”* 해야 할 때다.

### 6.7.2 “재귀적 데이터 구조” 순회

*트리, 그래프, XML, JSON, 디렉토리* 같은 *재귀적 데이터 구조* 를 *깊이 우선* 으로 순회할 때, *재귀 + yield from* 패턴이 가장 자연스럽다.

```python
def walk_xml(node):
    yield node.tag, node.attrib
    for child in node:
        yield from walk_xml(child)
```

`xml.etree.ElementTree` 의 *Element* 객체는 *자식 노드* 의 iterable 을 갖고, 각 자식도 같은 구조다. *재귀 + yield from* 으로 *깊이 우선* 으로 모든 노드를 yield 할 수 있다.

### 6.7.3 “비동기 코루틴” 으로의 확장

`yield from` 은 *네이티브 코루틴* `async def` 에서 `await` 으로 일반화된다. 즉 *서브 코루틴에게 위임* 한다는 의미는 *asyncio* 의 *await* 와 같은 자리를 차지한다. [PEP 492](https://peps.python.org/pep-0492/) 가 이 *일반화* 를 정의한다.

```python
async def main():
    result = await sub()                # yield from sub() 의 async 버전
```

`await` 은 *awaitable* (coroutine, future, task) 에게 *위임* 한다. `yield from` 이 *iterator* 에게 위임하는 것과 의미상 같다. *asyncio* 의 *await* 가 *yield from* 의 *비동기 후손* 이라고 이해하면, *PEP 380 → PEP 492* 로의 진화 흐름이 자연스럽게 읽힌다.

### 6.7.4 “데이터 흐름의 분리” 의 가치

*서브 제너레이터* 별로 *데이터 흐름* 을 분리하면, 각 단계가 *독립적으로 테스트* 가능하고 *재사용* 가능하다. *메인 제너레이터* 는 *“전체 흐름”* 만 정의한다. 이 *관점의 분리* 가 `yield from` 의 진짜 가치다.

---

## 6.8 코루틴과 서브 제너레이터의 결합 — `yield from` + `send`

`yield from` 의 *양방향 통신* 을 활용하면, *외부* 의 `send` 가 *서브 코루틴* 에게 직접 전달된다. *메인 코루틴* 이 *“통과”* 만 한다면, *외부* 와 *서브 코루틴* 은 *직접* 대화하는 것처럼 보인다.

### 6.8.1 예제: 코루틴 위임

```python
def sub():
    while True:
        value = yield
        yield value * 2

def main():
    yield from sub()
```

```python
g = main()
next(g)                        # sub 시작
g.send(10)                     # 20 (서브 코루틴이 'value * 2' 로 응답)
g.send(20)                     # 40
```

*메인* 은 *아무 일도 하지 않는다*. *외부* 와 *서브* 가 직접 통신한다. *메인* 이 *값을 변형* 한다면, 그 *변형된* 값이 *외부* 에 yield 된다.

```python
def main_with_transform():
    for x in sub():
        yield x + 100
```

이 경우 *서브* 의 *yield* 값에 `+100` 이 더해진 값이 *외부* 로 전달된다. *서브* 의 *return* 값은 *메인의 `yield from` 의 결과* 로 들어온다.

### 6.8.2 “투명성” 의 이점

*투명성* 덕분에 *서브 코루틴* 은 *“메인이 누구인지”* 몰라도 된다. *서브* 는 *“누가 send/close 하든 동일한 시맨틱”* 으로 동작한다. *메인* 은 *“서브의 시맨틱”* 을 *추가 변형* 만 한다. 이 *계층 분리* 는 *대형 시스템* 에서 *모듈성* 의 근간이 된다.

### 6.8.3 “메인의 추가 작업” 의 예

```python
def main_logging():
    for value in sub():
        print('log:', value)
        yield value
```

*메인* 은 *서브의 yield* 값을 *로그로 남기면서* 그대로 *외부* 에 yield 한다. *서브* 는 *로그에 대해 모른다*. *메인* 의 *추가 작업* 이 *서브의 동작* 에 영향을 주지 않는다.

---

## 6.9 “Coroutine Average” 의 실용적 변형

### 6.9.1 “이동 평균 + 종료” 패턴

```python
from typing import Generator, Optional

def averager_terminable(terminate_value=None) -> Generator[Optional[float], float, tuple]:
    total = 0.0
    count = 0
    average = None
    while True:
        term = yield average
        if term == terminate_value:
            return count, average
        total += term
        count += 1
        average = total / count
```

*send* 로 *값* 을 보내다가 *terminate_value* 를 보내면 *return* 으로 *결과* 를 돌려준다. *return 값* 은 `StopIteration.value` 에 저장된다.

```python
coro = averager_terminable(terminate_value=None)
next(coro)                              # None
coro.send(10)                           # 10.0
coro.send(20)                           # 15.0
try:
    coro.send(None)                     # terminate
except StopIteration as e:
    print(e.value)                      # (2, 15.0)
```

### 6.9.2 “*동시 진행* 코루틴들”

여러 코루틴을 *번갈아* 진행시키는 패턴도 `yield from` 으로 단순화된다.

```python
def ticker():
    for i in count():
        yield i

def averager_of_ticker():
    for t in ticker():
        # t 의 이동 평균을 계산
        ...
```

다만 *복잡한 조정* 이 필요하면 *asyncio* 의 *Task* 가 더 적합하다.

### 6.9.3 “*close()* 와 자원 정리”

`coro.close()` 는 *GeneratorExit* 예외를 *현재 yield 위치* 에 던진다. *제너레이터* 가 `try/finally` 로 자원을 정리할 수 있다.

```python
def file_reader(path):
    f = open(path)
    try:
        while True:
            line = yield f.readline()
            if not line:
                break
    finally:
        f.close()                    # close() 시 자원 정리
```

*메인이* `yield from file_reader(path)` 로 위임하고, *외부* 가 `g.close()` 를 호출하면 *file_reader* 의 *finally* 가 실행되어 파일이 닫힌다. *자원 누수* 가 자동으로 방지된다.

---

## 6.10 `yield from` 과 비동기 — `async/await` 로의 다리

[PEP 492](https://peps.python.org/pep-0492/) 가 도입된 이후, *네이티브 코루틴* `async def` 와 `await` 가 *표준 비동기 모델* 이 됐다. `yield from` 의 *비동기 후손* 이 `await` 다.

* `yield from iter`  →  `await awaitable`
* *클래식 코루틴* (제너레이터)  →  *네이티브 코루틴* (`async def`)

이 매핑을 이해하면, *PEP 380 → PEP 492* 의 진화가 자연스럽게 읽힌다. *yield from* 의 *양방향 통신*, *return 값 전달*, *close 자동 위임* 은 *await* 에서도 그대로 유지된다. 다만 *await* 는 *awaitable* 객체만 받고, *asyncio.Future* / *Task* 같은 *비동기 객체* 와 *함께 작동* 한다.

```python
import asyncio

async def fetch_data():
    # 서브 코루틴에 위임
    data = await fetch_from_db()      # yield from 의 async 버전
    return data
```

`await fetch_from_db()` 는 `fetch_data` 가 *일시 정지* 한 뒤, *fetch_from_db* 가 끝나면 *재개* 되고, *return 값* 이 *data* 에 들어온다. 이 시맨틱은 *yield from* 의 시맨틱과 정확히 일치한다.

### 6.10.1 “`yield from` → `await`” 의 역사적 의의

* 클래식 코루틴은 *asyncio* 이전 시대의 *동시성 도구*.
* `yield from` 은 *그 시대* 의 *서브 코루틴 위임* 구문.
* `async/await` 은 *그 후속* 으로, *명시적 async/await 키워드* 로 의도를 분명히 한다.
* 클래스식 코루틴은 여전히 유효하지만, *신규 코드* 에서는 *asyncio* + *네이티브 코루틴* 이 권장된다.

`yield from` 을 이해하면 `await` 도 자연스럽게 이해된다. 두 구문은 *같은 본질 — “서브에게 위임”* — 을 *다른 시대* 에서 *다른 표기* 로 표현한 것이다.

---

## 6.11 `yield from` 의 흔한 실수

### 6.11.1 “`yield from` 의 `expr` 이 *iterable* 이 아닐 때”

`yield from <expr>` 의 `<expr>` 은 *iterable* 이어야 한다. *iterator* 도 `iter()` 가 적용되므로 *iterable* 이다. 만약 *숫자* 같은 *non-iterable* 을 주면 `TypeError` 다.

```python
def bad():
    yield from 10     # TypeError
```

### 6.11.2 “`return` 의 값이 외부에서 직접 안 보임”

```python
def sub():
    yield 1
    return 'done'

g = sub()
next(g)                  # 1
try:
    next(g)              # StopIteration, value='done'
except StopIteration as e:
    print(e.value)        # 'done'
```

*외부* 에서 직접 *return 값* 을 받으려면 `try/except StopIteration` 이 필요하다. *yield from* 의 *값* 으로 받으면 더 자연스럽다.

### 6.11.3 “`yield from` 의 *투명성* 과 *메인의 변형*”

```python
def main_filter():
    for x in sub():
        if x > 0:
            yield x
```

*메인이 필터링* 하면, *서브* 의 *falsy yield 값* 은 *외부* 에 전달되지 않는다. *메인이 무엇을 yield 하느냐* 가 *외부에 보이는 값* 을 결정한다. *투명성* 은 *메인이 그대로 통과시킬 때* 만 100% 적용된다.

### 6.11.4 “`send(None)` 으로 시작”

*제너레이터 / 코루틴* 의 첫 호출은 `next(g)` 또는 `g.send(None)` 이어야 한다. *메인이 yield from* 으로 위임하더라도, *서브* 가 *아직 시작되지 않은* 상태라면 *외부* 가 *send* 하기 전까지 *서브* 가 *첫 yield* 까지 진행해야 한다. *메인* 의 *시작* 시 `next` 가 자동 호출되지 않으므로, *외부* 가 *next(main)* 을 먼저 호출해야 한다.

### 6.11.5 “`close` 와 `GeneratorExit` 의 *상호작용*”

*메인* 이 *yield from* 으로 위임 중일 때 *외부* 가 `g.close()` 를 호출하면, *서브* 에게 `GeneratorExit` 이 던져진다. *서브* 가 `try/finally` 로 자원을 정리하고 *정상 종료* 하면, *메인* 도 *정상 종료* 한다. 만약 *서브* 가 `GeneratorExit` 을 *무시* 하거나 *새 yield* 를 하면, *RuntimeError* 가 발생한다.

```python
def sub():
    try:
        yield 1
        yield 2
    except GeneratorExit:
        print('sub closed')
        # finally 만 실행되고 yield 하면 안 됨

def main():
    yield from sub()
```

이 부분은 *PEP 342, 380* 의 “*Specification*” 단락에 자세히 명시돼 있다.

### 6.11.6 “제너레이터 안에서 `StopIteration` 직접 raise”

PEP 479 부터, *제너레이터* 안에서 *발생한* `StopIteration` 은 `RuntimeError` 로 변환된다. *메인이 yield from 으로 위임* 중일 때 *서브* 안에서 `StopIteration` 이 발생하면, *메인이 try/except StopIteration* 으로 잡을 수 있다. 다만 *메인이 명시적으로 잡지 않으면* *외부로 leak* 된다. 이 부분은 PEP 479 의 “*exceptions leaking out*” 단락에 자세히 설명돼 있다.

---

## 6.12 “서브 제너레이터 위임” 패턴의 정리

`yield from` 의 핵심을 한 문장으로 요약한다.

> **“`yield from` 은 *현재 제너레이터* 와 *서브 iterable* 사이의 *투명한 양방향 채널* 을 만든다. *값* 도 *제어* 도 *예외* 도 양방향으로 흐르고, *return 값* 도 자동으로 전달된다.”**

이 *투명한 채널* 은 *iterator 빌딩 블록* 의 합성을 자연스럽게 만들며, *재귀적 데이터 구조* 의 *깊이 우선 순회* 를 한 줄로 표현하고, *코루틴 위임* 의 기본 도구가 된다. *asyncio* 의 *await* 는 이 *투명성* 을 *비동기 세계* 로 그대로 옮긴 후손이다.

---

## 6.13 정리

| 주제 | 핵심 |
| --- | --- |
| `yield from <iterable>` | 서브 iterable 의 값을 외부에 yield |
| 양방향 통신 | 외부 ↔ 서브 사이에 send/throw/close 가 자동 위임 |
| `return` 값 전달 | `result = yield from sub()` 로 받음 |
| 자원 관리 | `g.close()` 가 서브의 `GeneratorExit` 까지 자동 전파 |
| 트리 순회 | 재귀 + `yield from` 으로 깊이 우선 |
| 클래식 코루틴 | `yield` + `send` 로 양방향 통신, `typing.Generator` |
| `await` 로의 확장 | `yield from` 의 비동기 후손, `asyncio` 의 기본 도구 |

### 한 줄 요약

> **“`yield from` 은 *서브 제너레이터* 와 *외부* 사이의 *투명한 양방향 채널* 이다. *값* / *제어* / *예외* 가 양방향으로 흐르고, *return 값* 도 자동 전달된다. 이 *투명성* 덕분에 *iterator 빌딩 블록의 합성*, *재귀적 트리 순회*, *코루틴 위임* 이 자연스럽게 표현된다.”**

---

## 6.14 연습 문제

1. **`chain` 의 재구현**: `yield from` 으로 `itertools.chain` 과 정확히 같은 의미의 `chain(*iterables)` 를 구현하라. `list(chain([1, 2], (3, 4)))` 가 `[1, 2, 3, 4]` 인지 확인하라.

2. **재귀 트리 순회**: 트리 자료 구조를 정의하고, *전위 / 중위 / 후위* 순회를 각각 *재귀 + yield from* 으로 작성하라. 깊이 제한을 둘 수 있는 옵션을 추가하라.

3. **`yield from` 의 return 값**: `sub` 제너레이터가 `return 'done'` 으로 끝나고, `main` 이 `result = yield from sub()` 로 받는 코드를 작성하라. *외부* 에서 `next(g)` 만 호출할 때 *return 값* 이 어떻게 보이는지 확인하라.

4. **서브 코루틴의 `send` 전달**: `yield from` 으로 위임한 코루틴이 *외부의 send 값을 그대로 받는지* 확인하라. *메인이 send 값을 변형하지 않는 경우* 와 *변형하는 경우* 를 비교하라.

5. **자원 정리**: `try/finally` 로 자원을 정리하는 `file_reader` 같은 제너레이터를 작성하고, *외부* 가 `g.close()` 를 호출했을 때 `finally` 가 실행되는지 확인하라.

6. **클래식 코루틴 averager**: `averager` 코루틴을 구현하고, *running average* 가 정확히 유지되는지 확인하라. *첫 호출* 이 `next(coro)` 여야 하는 이유를 직접 디버거로 확인하라.

7. **`inspect.getgeneratorstate` 의 활용**: `averager` 의 *상태* 를 *GEN_CREATED → GEN_SUSPENDED → GEN_CLOSED* 의 흐름으로 관찰하라.

8. **`async/await` 로의 번역**: 위 `averager` 를 `async def` 와 `await` 로 번역해 보라. *yield from* 이 *await* 으로 어떻게 일반화되는지 체감하라.

9. **PEP 479 의 효과**: `yield from` 위임 중 *서브* 안에서 `raise StopIteration` 을 일으키면 어떤 일이 벌어지는지 확인하라. PEP 479 의 *변환 규칙* 을 직접 체감하라.

10. **“투명한 채널” 의 한계**: *메인* 이 *서브의 yield 값을 변형* 하면, *외부* 에게 전달되는 값이 어떻게 달라지는지 확인하라. “*투명성*” 이 *메인의 작업* 에 따라 부분적이라는 점을 적어 보라.

---

## 6.15 더 읽을 거리

* [PEP 380 – Syntax for Delegating to a Subgenerator](https://peps.python.org/pep-0380/)
* [PEP 342 – Coroutines via Enhanced Generators](https://peps.python.org/pep-0342/)
* [PEP 492 – Coroutines with async and await syntax](https://peps.python.org/pep-0492/)
* [PEP 525 – Asynchronous Generators](https://peps.python.org/pep-0525/)
* [PEP 479 – Change StopIteration handling inside generators](https://peps.python.org/pep-0479/)
* [`asyncio` — Asynchronous I/O](https://docs.python.org/3/library/asyncio.html)
* [`types.GeneratorType`](https://docs.python.org/3/library/types.html#types.GeneratorType)
* [`inspect.getgeneratorstate`](https://docs.python.org/3/library/inspect.html#inspect.getgeneratorstate)
* [`typing.Generator`, `typing.AsyncGenerator`](https://docs.python.org/3/library/typing.html)
* Fluent Python 2/E — Chapter 17 “Subgenerators with yield from”, “Reinventing chain”, “Traversing a Tree”, “Classic Coroutines”

---

### 정리

이번 섹션의 핵심을 한 문장으로 다시 적는다.

> **“`yield from` 은 *서브 제너레이터* 와 *외부* 사이의 *투명한 양방향 채널* 이며, *값* / *제어* / *예외* / *return 값* 이 양방향으로 흐른다. 이 *투명성* 은 *iterator 빌딩 블록의 합성*, *재귀적 트리 순회*, *코루틴 위임* 을 자연스럽게 만들며, *asyncio* 의 *await* 로 이어지는 디딤돌이다.”**

이로써 6 개 섹션의 학습이 모두 끝났다. 다음 문서에서는 6 개 섹션의 인덱스를 제공한다.
# 30제 — Python 순회 자기 점검 문제집

> *Fluent Python 2/E · Chapter 17* 의 핵심을 자기 점검할 수 있는 **30개 문제**.
> 인덱스의 “다 읽은 후의 자기 점검” 15문항을 **세분화**하고 **실전 응용 변형**을 추가해 **2배**로 확장했다.
> 각 문제는 *난이도*(🟢 기초 / 🟡 중급 / 🔴 심화), *유형*(💻 코드 / 📖 설명 / 🔬 분석), *정답 힌트* 를 함께 제공한다.
>
> 출처: [`01-iter-function.md`](01-iter-function.md) ~ [`06-yield-from-and-coroutines.md`](06-yield-from-and-coroutines.md)

---

## 📋 문제 목록

| # | 주제 | 난이도 | 유형 |
| --- | --- | --- | --- |
| 1 | `for` 루프의 바이트코드 — `GET_ITER` | 🟢 | 🔬 |
| 2 | `for` 루프의 바이트코드 — `FOR_ITER` | 🟢 | 🔬 |
| 3 | Glossary 표현 — `iterable` | 🟢 | 📖 |
| 4 | Glossary 표현 — `iterator` | 🟢 | 📖 |
| 5 | iterator 의 `isinstance(., Iterable)` 비대칭 | 🟡 | 📖 |
| 6 | iterator 의 `__iter__ == self` 규약과 `for` 루프 | 🟡 | 📖 |
| 7 | `iter(callable, sentinel)` 의 두 번째 인자 시맨틱 | 🟢 | 📖 |
| 8 | `iter(callable, sentinel)` 의 C 레벨 `callable_iter` | 🔴 | 🔬 |
| 9 | `Sentence` Take #2 — 클래식 iterator 의 두 클래스 분할 | 🟡 | 💻 |
| 10 | `Sentence` Take #3 — 제너레이터 함수 | 🟢 | 💻 |
| 11 | `Sentence` Take #4 — `re.finditer` 의 게으름 | 🟡 | 💻 |
| 12 | `Sentence` Take #5 — 제너레이터 표현식 | 🟢 | 💻 |
| 13 | Take #2 → #5 의 비교표 | 🟡 | 📖 |
| 14 | `collections.abc` 의 iterable 계층 그림 | 🟡 | 📖 |
| 15 | `Sequence` vs `Iterable` vs `Iterator` vs `Generator` | 🟡 | 📖 |
| 16 | 산술 진행 — 시퀀스 버전 | 🟢 | 💻 |
| 17 | 산술 진행 — 클래식 iterator 버전 | 🟡 | 💻 |
| 18 | 산술 진행 — 제너레이터 함수 버전 | 🟡 | 💻 |
| 19 | 산술 진행 — `itertools.count` + `takewhile` 한 줄 | 🟡 | 💻 |
| 20 | `itertools` 빌딩 블록 카테고리 분류표 | 🟡 | 📖 |
| 21 | `sum` 의 `start` 인자 시맨틱 | 🟢 | 💻 |
| 22 | `any` / `all` 의 단축 평가 + iterator 의 게으름 | 🟡 | 💻 |
| 23 | `map` 의 현대적 대체재 — 리스트/제너레이터 컴프리헨션 | 🟢 | 💻 |
| 24 | `filter` 의 현대적 대체재 — 컴프리헨션의 `if` | 🟢 | 💻 |
| 25 | `reduce` 의 현대적 대체재 — built-in reducer 우선 | 🟡 | 💻 |
| 26 | `functools.reduce` 의 `initializer` 가 빈 iterable 에서 중요한 이유 | 🟡 | 💻 |
| 27 | `yield from` 의 세 가지 의미 — 값 / 제어 / return | 🔴 | 📖 |
| 28 | 재귀 + `yield from` 으로 트리 깊이 우선 순회 | 🟡 | 💻 |
| 29 | 클래식 코루틴 `averager` — `yield`/`send` 와 첫 호출 규칙 | 🟡 | 💻 |
| 30 | PEP 479 와 `yield from` 위임의 예외 흐름 | 🔴 | 🔬 |

총 **30 문제** (🟢 기초 9, 🟡 중급 14, 🔴 심화 7).

---

## 🟢 기초 (9문제)

### 1. `for` 루프의 바이트코드 — `GET_ITER`

🟢 기초 / 🔬 분석

`dis` 모듈로 다음 코드를 디스어셈블해 보고, `GET_ITER` 가 어떤 역할을 하는지 설명하라.

```python
def f(iterable):
    for x in iterable:
        print(x)
```

`dis.dis(f)` 의 출력에서 `GET_ITER` 라인을 찾고, 그것이 *어떤* 내부 함수를 호출하는지 적어라. (C 레벨 함수 이름까지 적으면 더 좋다.)

> **힌트**: `GET_ITER` 는 `PyObject_GetIter` 를 호출한다. `Objects/abstract.c` 의 `PyObject_GetIter` 가 `__iter__` → `__getitem__` 의 두 단계 fallback 으로 동작한다는 사실을 떠올려 보라.

---

### 2. `for` 루프의 바이트코드 — `FOR_ITER`

🟢 기초 / 🔬 분석

위와 같은 코드를 디스어셈블했을 때 `FOR_ITER` 의 동작을 설명하라. 특히 다음 두 가지를 답하라.

* `FOR_ITER` 가 *성공* 했을 때 스택에 무엇이 남는가?
* `FOR_ITER` 가 `StopIteration` 을 만났을 때 어떻게 처리하는가? (어디로 점프하는가?)

> **힌트**: CPython 의 `FOR_ITER` opcode 는 “*iterator 의 `__next__` 를 호출*” 한다는 한 줄짜리 정의로 환원된다. [3.12 디스어셈블러](https://docs.python.org/3/library/dis.html) 의 `FOR_ITER` 항목을 참조하라.

---

### 3. Glossary 표현 — `iterable`

🟢 기초 / 📖 설명

[Python 3.12 Glossary](https://docs.python.org/3/glossary.html) 의 “iterable” 항목을 그대로 (또는 핵심만) 옮겨 적어라. 그리고 그 정의에서 “*members one at a time*” 과 “*`__iter__()` method or with a `__getitem__()` method*” 이 어떤 의미인지 적어라.

> **힌트**: Glossary 의 정의는 “*An object capable of returning its members one at a time*” 으로 시작한다. 두 번째 문단이 “*Examples of iterables include…*” 로 이어진다.

---

### 4. Glossary 표현 — `iterator`

🟢 기초 / 📖 설명

[Python Glossary](https://docs.python.org/3/glossary.html) 의 “iterator” 항목을 옮겨 적어라. 특히 “*an iterator object is exhausted and any further calls…*” 의 의미와 “*every iterator is also iterable*” 라는 문장이 어떤 의미인지 답하라.

> **힌트**: 정의의 핵심은 “*successive items in the stream*” 과 “*`StopIteration` exception*” 이다. 두 번째 문단의 “*its own iterator*” 가 iterator 의 `__iter__` 가 `self` 를 반환해야 한다는 규약으로 이어진다.

---

### 5. iterator 의 `isinstance(., Iterable)` 비대칭

🟡 중급 / 📖 설명

다음 코드의 결과를 적고, 그 이유를 설명하라.

```python
from collections.abc import Iterable, Iterator

class OnlyGetItem:
    def __init__(self, data): self._data = list(data)
    def __getitem__(self, i):
        if i >= len(self._data): raise IndexError
        return self._data[i]

obj = OnlyGetItem([1, 2, 3])
print(isinstance(obj, Iterable))      # ?
print(isinstance(obj, Iterator))      # ?
for x in obj: print(x)                 # ?
```

특히 다음 두 가지를 답하라.

1. 왜 `isinstance(obj, Iterable) == False` 인가?
2. 왜 `for x in obj:` 는 정상 동작하는가?

> **힌트**: `collections.abc.Iterable` 의 `__subclasshook__` 은 `__iter__` 의 존재만 검사한다. 반면 `iter()` 의 1-인자 형태는 `__iter__` → `__getitem__` 의 두 단계 fallback 을 따른다. 이 비대칭이 답의 출발점이다.

---

### 6. iterator 의 `__iter__ == self` 규약과 `for` 루프

🟡 중급 / 📖 설명

iterator 의 `__iter__` 가 *보통* `self` 를 반환하는 이유를 `for` 루프의 내부 동작과 연결해 설명하라. 만약 iterator 의 `__iter__` 가 매번 *새 객체* 를 만든다면 어떤 일이 벌어지는가? 두 가지를 답하라.

1. `__iter__` 가 `self` 를 반환하지 않을 때 `for` 루프의 동작이 어떻게 변하는가?
2. 사용자가 iterator 의 “*한 번에 한 번만 순회*” 라는 기대를 갖는 이유가 어떻게 무너지는가?

> **힌트**: `for` 루프는 “*iterator 의 진행 상태*” 를 *그 iterator* 자체에서 유지해야 한다. `__iter__` 가 새 객체를 만들면 진행 상태가 분기된다.

---

### 7. `iter(callable, sentinel)` 의 두 번째 인자 시맨틱

🟢 기초 / 📖 설명

`iter(callable, sentinel)` 의 두 번째 인자 `sentinel` 의 시맨틱을 적어라. 또한 다음 코드에서 `iter(callable, sentinel)` 가 종료되는 시점과 그 이유를 답하라.

```python
import random
def roll_d6():
    return random.randint(1, 6)

for roll in iter(roll_d6, 6):
    print(roll)
```

> **힌트**: 2-인자 형태의 `iter` 는 `callable()` 의 반환값이 `sentinel` 과 `==` 로 같아지는 순간 `StopIteration` 을 일으킨다. `sentinel` 로 *종료 조건* 을 *값* 으로 표현한다.

---

### 8. `iter(callable, sentinel)` 의 C 레벨 `callable_iter`

🔴 심화 / 🔬 분석

CPython 의 [`Objects/builtinobject.c`](https://github.com/python/cpython/blob/main/Objects/builtinobject.c) 의 `builtin_iter_impl` (또는 `callable_iter` 의 `__next__`) 가 2-인자 `iter` 를 어떻게 처리하는지 의사 코드로 적어라. 그리고 `==` 비교가 `PyObject_RichCompareBool` 로 수행된다는 사실이 *어떤 사용자 정의 객체* 도 `sentinel` 이 될 수 있게 만드는 이유를 설명하라.

> **힌트**: 2-인자 형태는 내부적으로 `callable_iter` 객체를 만들고, 그 객체의 `__next__` 는 `value = callable(); if value == sentinel: raise StopIteration; return value` 의 의사 코드를 따른다.

---

### 9. `Sentence` Take #2 — 클래식 iterator 의 두 클래스 분할

🟡 중급 / 💻 코드

다음 사양을 만족하는 `Sentence` 클래스를 **두 클래스(`Sentence`, `SentenceIterator`)** 로 구현하라.

* `Sentence` 는 `__iter__` 만 갖는다. `__init__` 에서 `re.findall` 로 단어 리스트를 만든다.
* `SentenceIterator` 는 `__iter__` 와 `__next__` 를 갖는다. `__iter__` 는 `self` 를 반환한다.
* `s = Sentence("The time has come,")` 으로 인스턴스를 만들고, `for w in s:` 와 `list(s)` 가 같은 결과를 내는지 확인하라.

> **힌트**: 본문 3.1.1 의 “*전체 코드*” 를 그대로 따라 적되, 손으로 직접 작성해 보는 것이 학습에 효과적이다.

---

### 10. `Sentence` Take #3 — 제너레이터 함수

🟢 기초 / 💻 코드

위 9번의 `Sentence` 를 **제너레이터 함수** 버전으로 다시 구현하라. 클래스 두 개가 아닌 클래스 하나로 끝내야 한다. `__iter__` 의 본문은 단어 리스트를 한 번 순회하며 `yield` 만 한다.

> **힌트**: 본문 3.2.1 의 “*전체 코드*” 를 참조하라. `__iter__` 본문은 2줄이다.

---

### 11. `Sentence` Take #4 — `re.finditer` 의 게으름

🟡 중급 / 💻 코드

`re.findall` 대신 `re.finditer` 를 사용해 `Sentence` 를 *게으르게* 구현하라. `__init__` 은 `text` 만 저장하고, `__iter__` 의 본문은 *match 객체를 한 번에 하나씩* `yield` 한다. 이 구현이 *Take #3* 와 비교해 어떤 메모리/시간 트레이드오프를 갖는지 적어라.

> **힌트**: 본문 3.4.1 의 코드. 트레이드오프는 (1) *재순회 시 재계산*, (2) *인덱싱/`len`/`in` 검사* 의 두 가지다.

---

### 12. `Sentence` Take #5 — 제너레이터 표현식

🟢 기초 / 💻 코드

위 11번의 `Sentence` 를 **제너레이터 표현식** 한 줄로 다시 구현하라. `__iter__` 의 본문은 `(match.group() for match in RE_WORD.finditer(self.text))` 다. 이 한 줄이 본질적으로 Take #4 와 같다는 점을 *메모리/시간 트레이드오프* 측면에서 설명하라.

> **힌트**: 본문 3.5.1 의 코드. *제너레이터 표현식* 과 *제너레이터 함수* 는 *동치* 다. 단지 표기법만 다르다.

---

### 13. Take #2 → #5 의 비교표

🟡 중급 / 📖 설명

다음 표를 완성하라. 5개 항목(인터페이스 / 클래스 수 / `__iter__` 의 본문 길이 / `__init__` 의 비용 / 재순회 시 단어 재계산 여부) 에 대해 Take #2~#5 를 비교하라.

| 항목 | Take #2 | Take #3 | Take #4 | Take #5 |
| --- | --- | --- | --- | --- |
| 인터페이스 | | | | |
| 클래스 수 | | | | |
| `__iter__` 본문 길이 | | | | |
| `__init__` 비용 | | | | |
| 재순회 시 단어 재계산 | | | | |

> **힌트**: 본문 3.7 의 “*Same Job, Five Takes*” 표를 떠올려 보라. 다만 *Take #1* 은 본 표에서 제외되었다.

---

### 14. `collections.abc` 의 iterable 계층 그림

🟡 중급 / 📖 설명

다음 추상 클래스들의 상속 관계를 텍스트 다이어그램으로 그려라.

* `Iterable`
* `Iterator`
* `Generator`
* `Reversible`
* `Collection`
* `Sequence`
* `MutableSequence`
* `Mapping`
* `MutableMapping`
* `Set`
* `MutableSet`

특히 다음 두 가지를 답하라.

1. `Iterator` 가 `Collection` 의 서브타입이 *아닌* 이유는 무엇인가?
2. `Generator` 가 `Iterator` 의 서브타입이라는 사실이 *제너레이터* 의 *iterator* 자격에 대해 무엇을 시사하는가?

> **힌트**: 본문 2.7 의 “*`__contains__`, `__len__` 과의 관계*” 단락을 떠올려 보라. `Iterator` 는 `__len__` 과 `__contains__` 가 *없다* (즉 *컨테이너 시맨틱* 이 없음).

---

### 15. `Sequence` vs `Iterable` vs `Iterator` vs `Generator`

🟡 중급 / 📖 설명

다음 각 클래스에 대해 *isinstance* 검사의 결과(True/False) 를 적어라.

* `list` (`[1, 2, 3]`)
* `iter([1, 2, 3])`
* `(x for x in [1, 2, 3])` (제너레이터 표현식)
* `def gen(): yield 1; yield 2` 의 호출 결과

각각에 대해 `isinstance(., Sequence)`, `isinstance(., Iterable)`, `isinstance(., Iterator)`, `isinstance(., Generator)` 의 결과를 적고, 그 이유를 설명하라.

> **힌트**: `Sequence` 는 `__len__` + `__getitem__` 을 요구한다. `Generator` 는 `send`/`throw`/`close` 메서드의 존재로 구분된다.

---

## 🟡 중급 (계속 — 16~25)

### 16. 산술 진행 — 시퀀스 버전

🟢 기초 / 💻 코드

`ArithmeticProgression(begin, step, end=None)` 을 *시퀀스 프로토콜* 로 구현하라. `__len__` 과 `__getitem__` 을 정의해 `len(ap)`, `ap[0]`, `ap[1]`, `ap[2:5]` 가 동작하게 하라. `end=None` 일 때 `len()` 이 `TypeError` 를 일으키도록 처리하라.

> **힌트**: 본문 4.1 의 코드. *end 가 있을 때만* `len` 이 동작하도록 분기한다.

---

### 17. 산술 진행 — 클래식 iterator 버전

🟡 중급 / 💻 코드

위 16번을 *iterator 인터페이스* 로 다시 구현하라. `Sentence Take #2` 와 마찬가지로 클래스 두 개로 분할한다 (`ArithmeticProgression` + `ArithmeticProgressionIterator`). `end=None` 일 때 *무한 진행* 이 가능해야 한다.

> **힌트**: 본문 4.2 의 코드. `__next__` 에서 `end` 가 있고 `current >= end` 면 `StopIteration`.

---

### 18. 산술 진행 — 제너레이터 함수 버전

🟡 중급 / 💻 코드

위 17번을 *제너레이터 함수* 버전으로 다시 구현하라. `Sentence Take #3` 와 마찬가지로 클래스 하나로 끝낸다. 단, `begin` 과 `step` 의 타입이 다를 수 있으므로 (예: `float` vs `int`) 진행 값의 타입이 *시작값과 일치* 하도록 캐스팅하라.

> **힌트**: 본문 4.3.1 의 `result_type = type(self.begin + self.step)` 캐스팅.

---

### 19. 산술 진행 — `itertools.count` + `takewhile` 한 줄

🟡 중급 / 💻 코드

위 18번과 같은 산술 진행을 **`itertools.count` + `itertools.takewhile`** 의 조합으로 *한 줄짜리 표현식* 으로 만들어라. 시작값 0, 공차 0.1, 종료 1 인 경우의 결과를 확인하라.

> **힌트**: 본문 4.4 의 “*`ArithmeticProgression` 과 `itertools.count` 의 비교*” 표. 부동소수점 누적 오차의 함정이 있으므로 결과가 정확히 `[0, 0.1, ..., 0.9]` 가 아닐 수 있다.

---

### 20. `itertools` 빌딩 블록 카테고리 분류표

🟡 중급 / 📖 설명

다음 `itertools` 함수들을 카테고리별로 분류하라.

* `count`, `cycle`, `repeat`, `chain`, `chain.from_iterable`, `islice`, `takewhile`, `dropwhile`, `filterfalse`, `compress`, `tee`, `groupby`, `accumulate`, `starmap`, `zip_longest`, `pairwise`, `product`, `permutations`, `combinations`, `combinations_with_replacement`

카테고리:

* **무한**: 한없이 진행 (조기 종료가 *필수*)
* **단축 종료**: 조건/개수 기반으로 빨리 멈춤
* **결합**: 여러 iterable 을 합성
* **슬라이싱**: 인덱스/범위로 자름
* **선택/필터**: 위치/조건으로 항목을 선택
* **분할**: 한 iterator 를 여러 개로
* **그룹화**: 연속된 동일 키를 묶음
* **누적**: 누적 결과를 yield
* **product / permutation / combination**: 순열/조합
* **zip 변형**: 여러 iterable 의 짝짓기

> **힌트**: 본문 4.4.3 의 “*17 가지 함수를 역할로 분류*” 단락을 떠올려 보라.

---

### 21. `sum` 의 `start` 인자 시맨틱

🟢 기초 / 💻 코드

다음 코드의 결과를 적고, 그 이유를 설명하라.

```python
sum([1, 2, 3, 4])               # ?
sum([1, 2, 3, 4], 100)          # ?
sum([], 100)                    # ?
sum([[1, 2], [3, 4], [5]], [])  # ?
```

특히 마지막 두 줄이 *어떻게* 동작하는지 (즉 `start` 가 *숫자가 아니어도* 되는 이유) 설명하라.

> **힌트**: `sum` 의 *내부 구현* 은 `start + item1 + item2 + ...` 다. *duck typing* 으로 `+` 가 정의된 모든 객체에 적용된다.

---

### 22. `any` / `all` 의 단축 평가 + iterator 의 게으름

🟡 중급 / 💻 코드

다음 두 코드를 비교하라.

```python
# (A) 즉시 리스트
def find_end_a(tokens):
    return any(token == 'END' for token in tokens)

# (B) 함수 호출을 한 번에 하나씩만
def gen_tokens():
    for i in range(1_000_000):
        if i == 100:
            yield 'END'
        else:
            yield f'tok_{i}'

# (A) 와 (B) 의 합성
list(find_end_a(gen_tokens()))    # ?
```

`(A)` 의 *iterator 친화성* 과 `any` 의 *단축 평가* 가 만나 *얼마나 적은* 항목만 실제로 소비되는지 추론하라. 또한 `gen_tokens()` 가 *무한 제너레이터* 였다면 어떻게 되는지도 적어라.

> **힌트**: *iterator* 의 게으름은 “*필요한 만큼만 본다*”. `any` 의 단축 평가는 “*truthy 발견 즉시 종료*”. 둘이 만나면 `gen_tokens` 의 *5번째* 이후 항목은 *만들어지지도 않는다*.

---

### 23. `map` 의 현대적 대체재 — 리스트/제너레이터 컴프리헨션

🟢 기초 / 💻 코드

다음 코드를 `map` + `lambda` 대신 **리스트 컴프리헨션** / **제너레이터 표현식** 으로 다시 작성하라. 그리고 두 표현의 *iterator 친화성* 차이를 설명하라.

```python
# 원본
list(map(lambda x: x.upper(), words))
list(map(int, ['1', '2', '3']))
list(map(str.strip, open('big.txt')))
```

> **힌트**: `[x.upper() for x in words]`, `[int(x) for x in ['1', '2', '3']]`, `(s.strip() for s in open('big.txt'))`. 마지막은 *iterator* 다.

---

### 24. `filter` 의 현대적 대체재 — 컴프리헨션의 `if`

🟢 기초 / 💻 코드

다음 코드를 `filter` + `lambda` 대신 **컴프리헨션의 `if`** 로 다시 작성하라. 또한 `filter` 의 *iterator 친화성* 이 컴프리헨션의 그것과 어떻게 같은지 / 다른지 설명하라.

```python
# 원본
list(filter(lambda s: s.startswith('py'), names))
list(filter(lambda x: x > 0, numbers))
list(filter(None, [0, 1, 2, '', 'a']))    # filter(None, ...) 의 시맨틱
```

> **힌트**: `[s for s in names if s.startswith('py')]`, `[x for x in numbers if x > 0]`, `[x for x in items if x]` (마지막은 *truthy* 만 통과).

---

### 25. `reduce` 의 현대적 대체재 — built-in reducer 우선

🟡 중급 / 💻 코드

다음 `reduce` 호출을 **`sum`, `any`, `all`, `min`, `max`** 중 가장 알맞은 *built-in* 으로 대체하라. *built-in 으로 대체 불가능한* `reduce` 사용 사례를 하나 직접 만들어라.

```python
# (1)
reduce(lambda a, b: a + b, [1, 2, 3, 4], 0)             # ?

# (2)
reduce(lambda a, b: a or b, [0, 0, 0, 1, 0], False)     # ?

# (3)
reduce(lambda a, b: a and b, [1, 2, 3, 4], True)        # ?

# (4)  built-in 으로 대체 불가능한 사례 (작성)
# ?
```

> **힌트**: (1) → `sum`. (2) → `any` (`bool` 강제 변환 + 단축 평가). (3) → `all`. (4)는 *join 처럼 단순한 built-in 으로 안 되는* “*임의의 누적 함수*” 가 답. 예: *사용자 정의 객체* 의 결합, *조건부 누적*, *running max + index* 등.

---

### 26. `functools.reduce` 의 `initializer` 가 빈 iterable 에서 중요한 이유

🟡 중급 / 💻 코드

다음 두 코드의 실행 결과를 적고, 차이를 설명하라. 특히 *iterator* 가 *비어 있을 수 있다* 는 사실과 `initializer` 의 역할을 연결해 답하라.

```python
# (A) initializer 없음
it = iter([])
reduce(lambda a, b: a + b, it)               # ?

# (B) initializer 0
it = iter([])
reduce(lambda a, b: a + b, it, 0)            # ?

# (C) 마찬가지로 sum
sum(it)                                       # ?
sum(it, 0)                                    # ?
```

> **힌트**: `reduce` 의 *spec* 은 “*initializer 가 없으면, iterable 의 첫 항목을 누적의 시작값으로 쓴다*”. *빈 iterable* 이면 *시작값을 가져올 수 없어* `TypeError`. *initializer* 가 있으면 *빈 iterable* 일 때도 *initializer* 가 *그대로 반환* 된다. *iterator* 는 *비어 있는지* 를 미리 알 수 없으므로, 견고한 `reduce` 사용은 *반드시 initializer* 와 함께 한다.

---

## 🔴 심화 (27~30)

### 27. `yield from <iter>` 의 세 가지 의미

🔴 심화 / 📖 설명

`yield from <iterable>` 의 의미를 다음 세 가지 축으로 설명하라. 각 축마다 *어디까지가 “단순 wrapper”이고 어디부터가 “투명한 채널”인가* 를 구분해 답하라.

1. **값의 위임 (delegation of values)** — 서브 iterable 의 yield 값을 외부에 그대로 전달.
2. **제어의 위임 (delegation of control)** — 외부에서 들어오는 `send` / `throw` / `close` 가 서브 iterable 에게 자동 위임.
3. **`return` 값의 전달 (propagation of return value)** — 서브 제너레이터의 `return` 값이 `result = yield from sub()` 의 `result` 로 들어옴.

특히 (2)와 (3) 가 *단순 wrapper (`for x in sub: yield x`)* 와 *어떻게 다른지* 가 핵심이다.

> **힌트**: 본문 6.1.2 의 PEP 380 “*Specification: Semantics*” 의사 코드를 떠올려 보라. (2)는 `send(_s)` 라는 줄, (3)은 `_r = _e.value` 라는 줄에서 드러난다.

---

### 28. 재귀 + `yield from` 으로 트리 깊이 우선 순회

🟡 중급 / 💻 코드

다음 `Tree` 클래스에 대해 *깊이 우선 전위 순회* 를 *재귀 + yield from* 으로 구현하라.

```python
class Tree:
    def __init__(self, label, *children):
        self.label = label
        self.children = list(children)
```

`yield from` *없이* 작성한 버전(중첩 for)도 함께 적어 보고, 두 버전의 코드 길이 차이를 비교하라.

> **힌트**: 본문 6.3.2 의 `inorder(t)`. *중첩 for 없이* `yield from inorder(child)` 한 줄로 끝난다.

---

### 29. 클래식 코루틴 `averager` — `yield/send` 와 첫 호출 규칙

🟡 중급 / 💻 코드

다음 `averager` 코루틴을 구현하고 동작을 시연하라.

```python
def averager():
    total = 0.0
    count = 0
    average = None
    while True:
        term = yield average
        total += term
        count += 1
        average = total / count
```

다음을 답하라.

1. 첫 호출은 왜 `next(coro)` 또는 `coro.send(None)` 이어야 하는가? `coro.send(10)` 을 첫 호출로 두면 무슨 일이 벌어지는가?
2. `coro.send(20)` 후 반환값은 무엇인가? 그 의미는?
3. `coro.close()` 호출 후 `coro.send(30)` 을 하면 어떻게 되는가?
4. `typing.Generator` 의 세 타입 인자(`YieldType`, `SendType`, `ReturnType`) 는 각각 무엇으로 채워야 하는가?

> **힌트**: 본문 6.5 의 “*Running Average*” 단락. *send 의 첫 호출* 은 “*`yield` 까지 진행*” 해야 *값을 받을 자리* 가 마련된다는 점이 핵심. *close* 후 *send* 는 `StopIteration` 이다.

---

### 30. PEP 479 와 `yield from` 위임의 예외 흐름

🔴 심화 / 🔬 분석

PEP 479 가 *제너레이터 내부의 `StopIteration`* 을 어떻게 다루는지 답하라. 다음 세 시나리오의 결과를 적고, 그 이유를 설명하라.

```python
# (1) 일반 제너레이터 안에서 raise StopIteration
def g1():
    yield 1
    raise StopIteration      # ?
    yield 2

list(g1())                   # ?
```

```python
# (2) yield from 위임 시, 서브에서 raise StopIteration
def sub():
    yield 1
    raise StopIteration      # 서브 안에서
    yield 2

def main():
    yield from sub()

list(main())                 # ?
```

```python
# (3) yield from 위임 시, 메인이 StopIteration 을 try/except 로 잡기
def main_catch():
    try:
        yield from sub()
    except StopIteration as e:
        yield f'caught: {e.value}'

list(main_catch())           # ?
```

특히 (2) 와 (3) 의 차이가 *예외 흐름* 에서 어떻게 드러나는지 답하라. PEP 479 가 *제너레이터 안의 `StopIteration`* 을 *본문이 끝났다는 신호* 로만 해석하도록 강제하는 이유가 무엇인지도 적어라.

> **힌트**: 본문 6.11.6 단락. PEP 479 이후, *제너레이터 안에서 발생한 `StopIteration`* 은 `RuntimeError` 로 변환된다. 다만 *메인이 try/except StopIteration* 으로 명시적으로 잡으면 *잡힌다*. *예외가 외부로 leak 되지 않는* 이유가 “*`for` 루프를 조용히 끝내는 미묘한 버그를 막기 위함*” 이라는 점.

---

## 보너스 — 실전 응용 5문제 (실제 데이터 처리)

문제를 30개로 확장했지만, *Fluent Python 17 장* 의 학습 효과를 실무에 직접 연결하기 위해 5개의 보너스 실전 문제를 추가한다. 본문 6개 섹션의 *모든 내용* 을 종합적으로 사용한다.

### 보너스 1. 거대한 로그 파일에서 “ERROR” 라인의 running count

🟡 중급 / 💻 코드

*수십 GB* 의 로그 파일에서 “ERROR” 가 포함된 줄의 *running count* 를 만들고 싶다. 즉 *N 번째 ERROR* 가 나타났을 때, 그 *시점까지* 의 *총 ERROR 수* 를 *N* 으로 출력한다. *iterator 친화성*, *`any`/`all` 의 단축 평가*, *제너레이터 함수* 를 모두 활용해 메모리 부담 없이 한 줄씩 처리하는 코드를 작성하라.

> **힌트**: `for i, line in enumerate(f, 1): if 'ERROR' in line: yield i` 같은 패턴. `sum(1 for line in f if 'ERROR' in line)` 도 가능하지만, *running count* (즉 *누적 진행*) 가 필요하면 *제너레이터* 가 더 적합.

### 보너스 2. 디렉토리 트리에서 `.py` 파일의 라인 수 총합

🟡 중급 / 💻 코드

`os.walk` 로 *디렉토리 트리* 를 순회하며, *모든 `.py` 파일* 의 *총 라인 수* 를 `sum` + `map` + `itertools.starmap` 으로 계산하라. `os.walk` 의 *iterator* 성질과 `sum` 의 *iterator 친화성* 을 활용한다.

> **힌트**: 본문 4.6.1 + 본문 5.12 의 “*`os.walk` 와 `starmap`*” 예. `sum(starmap(lambda d, _, fs: sum(1 for f in fs if f.endswith('.py')), os.walk('.')))`.

### 보너스 3. 두 정수열의 데카르트 곱에서 짝수만 + 상위 10개

🟡 중급 / 💻 코드

`itertools.count(1)` 로 만든 두 무한 정수열의 데카르트 곱에서 *짝수* 만 추리고, *상위 10개* 의 합을 구하라. *iterator 빌딩 블록의 합성* (`count → product → filterfalse → islice → sum`) 의 전형을 보인다.

> **힌트**: 본문 4.4.2 의 “*`itertools` 의 17 가지 함수를 ‘역할’ 로 분류*” 와 본문 4.11.1 의 “*iterator 합성*” 예. `sum(islice(filterfalse(lambda p: sum(p) % 2, product(count(1), count(1))), 10))`.

### 보너스 4. 트리 구조에서 깊이 ≤ 3 인 노드만

🟡 중급 / 💻 코드

위 28번의 `Tree` 에 대해 *깊이 ≤ 3* 인 노드만 yield 하는 함수를 *재귀 + yield from + 깊이 제한* 으로 작성하라. *조기 종료* 가 가능한지(예: 깊이 > 3 이면 그 자식은 더 이상 순회하지 않음)도 확인하라.

> **힌트**: 본문 6.3.4 의 “*깊이 제한*” 예. `if current > max_depth: return` 으로 *조기 종료*.

### 보너스 5. 클래식 코루틴 → 네이티브 코루틴 (async/await) 번역

🔴 심화 / 💻 코드

29번의 `averager` 클래식 코루틴을 **`async def` + `await` + `asyncio`** 의 *네이티브 코루틴* 으로 번역하라. *yield from* 이 *await* 로, *send* 가 *Queue.put* 또는 *await* 의 *값* 으로 어떻게 매핑되는지 적어라. *PEP 380 → PEP 492* 로의 *진화* 가 *어떤 추상화* 를 보존하는지도 답하라.

> **힌트**: 본문 6.10.1 의 “*`yield from` → `await`* 의 역사적 의의”. *asyncio* 의 `Queue`/`Stream`/`Future` 와 결합해 *네트워크에서 들어오는 값* 의 *running average* 를 만든다. *yield from* 의 *양방향 통신*, *return 값*, *투명성* 이 *await* 에 그대로 보존된다.

---

## 📊 난이도별/유형별 분포

| 난이도 | 코드(💻) | 설명(📖) | 분석(🔬) | 합계 |
| --- | --- | --- | --- | --- |
| 🟢 기초 | 7 | 3 | 2 | **9** (+4 보너스) |
| 🟡 중급 | 9 | 4 | 1 | **14** (+4 보너스) |
| 🔴 심화 | 1 | 1 | 2 | **7** (+1 보너스) |
| **합계** | **17** | **8** | **5** | **30** (+5 보너스) |

---

## ✅ 자기 채점 가이드

* **30문제 중 25개 이상** 답할 수 있으면 — *Fluent Python 17 장* 의 핵심을 충분히 흡수한 것.
* **20~24개** 답할 수 있으면 — 기본기는 잡혔으니 부족한 부분만 보강.
* **20개 미만** 이면 — 본문 6개 섹션을 한 번 더 정독 권장.

**보너스 5문제** 는 *종합 응용* 이므로 *별도* 로 채점한다. 5개 모두 해결할 수 있으면 *iterator 빌딩 블록 사고방식* 이 완전히 체화된 것이다.

---

## 🔗 본문으로 돌아가기

* [00-index.md](00-index.md) — 인덱스 / 15문항 자기 점검
* [01-iter-function.md](01-iter-function.md) — `iter()` 함수
* [02-iterables-vs-iterators.md](02-iterables-vs-iterators.md) — Iterable vs Iterator
* [03-classic-iterators-and-generators.md](03-classic-iterators-and-generators.md) — Sentence Take #2~#5
* [04-arithmetic-progression-and-itertools.md](04-arithmetic-progression-and-itertools.md) — Arithmetic Progression + itertools
* [05-iterable-reducing-functions.md](05-iterable-reducing-functions.md) — Iterable Reducing Functions
* [06-yield-from-and-coroutines.md](06-yield-from-and-coroutines.md) — `yield from` 과 클래식 코루틴

---

*문제집 끝. 정답이 필요하면 본문 6개 섹션의 본문/힌트/연습 문제를 참조하라.*
