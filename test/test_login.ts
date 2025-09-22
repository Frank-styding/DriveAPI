import { RouteLogin } from "../src/methods/login";
import { ConfigManger } from "../src/config/ConfigManger";
import { SheetManager } from "../src/lib/SheetManager";

describe("RouteLogin", () => {
  beforeAll(() => {
    // Configuración inicial si es necesario
    ConfigManger.setProperty({
      usersSpreadsheet: "TestUsers",
      usersSheet: "Users",
      passwordSheet: "Passwords",
    });
    // Simular registro de spreadsheet y datos si es necesario
    SheetManager.Spreadsheet.registerSpreadsheet("TestUsers");
    // Aquí podrías simular datos en SheetManager si tienes mocks
  });

  it("debe retornar correcto=false si el usuario no existe", () => {
    const body = {
      type: "login",
      data: { dni: "12345678", password: "wrongpass" },
    };
    const result = RouteLogin.method(body, "testid");
    expect(result.getContent()).toContain('"correct":false');
  });

  it("debe retornar correcto=true si el usuario y contraseña son válidos", () => {
    // Simular que SheetManager retorna datos válidos
    // Aquí deberías mockear SheetManager.Table.findByColumnValue y SheetManager.Row.getCell
    // Ejemplo:
    SheetManager.Table.findByColumnValue = jest.fn(() => ({ dni: "12345678" }));
    SheetManager.Row.getCell = jest.fn(() => "mypassword");

    const body = {
      type: "login",
      data: { dni: "12345678", password: "mypassword" },
    };
    const result = RouteLogin.method(body, "testid");
    expect(result.getContent()).toContain('"correct":true');
  });
});
