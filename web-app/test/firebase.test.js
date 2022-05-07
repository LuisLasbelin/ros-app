// ERROR: da un error en import(constants)
const putData =  require("../src/ros.js");

test("Enviar un dato a Firebase", async () => {
    const result = putData("test", {test: "cositas"});
    expect(result.test).toBe("cositas");
});