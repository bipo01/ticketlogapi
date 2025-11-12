import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import fs from "fs";
import XLSX from "xlsx";

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.post("/getFile", (req, res) => {
	const { pathInput, year, month, fileName, formats } = req.body;
	const filePath = path.join(pathInput, year, month, `${fileName}.${formats}`);

	if (fs.existsSync(filePath)) {
		const workbook = XLSX.readFile(filePath);
		const sheetName1 = workbook.SheetNames[0];
		const worksheet1 = workbook.Sheets[sheetName1];
		const worksheet1Data = XLSX.utils.sheet_to_json(worksheet1, { header: 1 });
		const header = {};
		worksheet1Data[0].forEach((h, i) => {
			header[h] = i;
		});
		const data = worksheet1Data.slice(1, -1);

		const viaturas = [...new Set(data.map((row) => row[header["PLACA"]]).filter((placa) => !placa.includes("MAQ")))].length;
		const maquinas = [...new Set(data.map((row) => row[header["PLACA"]]).filter((placa) => placa.includes("MAQ")))].length;
		const motoristas = [...new Set(data.map((row) => row[header["NOME MOTORISTA"]]))].length;
		const abastecimentos = data.length;

		const valorTotal = data
			.reduce((acc, cur) => {
				const valor = Number(cur[header["VALOR EMISSAO"]]);

				return acc + valor;
			}, 0)
			.toLocaleString("pt-BR", {
				style: "currency",
				currency: "BRL",
			});

		return res.status(200).json({
			viaturas,
			maquinas,
			motoristas,
			abastecimentos,
			valorTotal,
		});
	} else {
		return res.status(404).json({ erro: "ARQUIVO NÃO ENCONTRADO" });
	}
});

app.listen(port, () => {
	console.log(`API running on port ${port}`);
});
