# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - list [ref=e4]:
      - listitem [ref=e5]:
        - link "Ações" [ref=e6] [cursor=pointer]:
          - /url: /acoes
      - listitem [ref=e7]:
        - link "Clientes" [ref=e8] [cursor=pointer]:
          - /url: /clientes
      - listitem [ref=e9]:
        - link "Colaboradores" [ref=e10] [cursor=pointer]:
          - /url: /colaboradores
  - generic [ref=e12]:
    - heading "Login" [level=2] [ref=e13]
    - generic [ref=e14]:
      - generic [ref=e15]: "Usuário:"
      - textbox [ref=e16]
    - generic [ref=e17]:
      - generic [ref=e18]: "Senha:"
      - generic [ref=e19]:
        - textbox [ref=e20]
        - button "Mostrar senha" [ref=e21] [cursor=pointer]:
          - img
    - button "Entrar" [ref=e22] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e28] [cursor=pointer]:
    - img [ref=e29]
  - alert [ref=e32]
```