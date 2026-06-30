// Arquivo binário: cabeçalho de 12 bytes seguido pelos registros de produtos.
// O LocalStorage guarda somente um vetor de números inteiros entre 0 e 255.
const ATIVO=0x20, EXCLUIDO=0x2a, TAMANHO_CABECALHO=12, CHAVE_ARMAZENAMENTO="entrepares.produtos.bytes.v3";
const CAMPO={
	TAMANHO_CABECALHO: 1, TOMB: 2, LENGTH: 3, ID: 4, NAME: 5, CATEGORY: 6, PRICE: 7, STOCK: 8, PADDING: 9
};
const codificador=new TextEncoder(), decodificador=new TextDecoder();
const formatadorMoeda=new Intl.NumberFormat("pt-BR", {
	style: "currency", currency: "BRL"
});
class ArquivoBinario{
	constructor(){
		try{
			const data=JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO));
			this.bytes=Array.isArray(data)&&data.every(n=>Number.isInteger(n)&&n>=0&&n<=255)?Uint8Array.from(data): new Uint8Array();
		} catch{
			this.bytes=new Uint8Array()
		}
		if(this.bytes.length<TAMANHO_CABECALHO)this.reiniciar();
	}
	visao(bytes=this.bytes){
		return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	}
	salvar(){
		localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(Array.from(this.bytes)))
	}
	reiniciar(){
		this.bytes=new Uint8Array(TAMANHO_CABECALHO);
		this.visao().setBigInt64(4, -1n, true);
		this.salvar();
	}
	percorrer(visitor){
		const visao=this.visao();
		let posicao=TAMANHO_CABECALHO, numero=1;
		while(posicao+3<=this.bytes.length){
			const lapide=this.bytes[posicao], tamanhoConteudo=visao.getUint16(posicao+1, true), tamanhoTotal=tamanhoConteudo+3;
			if((lapide!==ATIVO&&lapide!==EXCLUIDO)||tamanhoConteudo<20||posicao+tamanhoTotal>this.bytes.length)break;
			if(visitor({
				posicao, tamanhoConteudo, tamanhoTotal, lapide, numero
			})===false)return;
			posicao+=tamanhoTotal;
			numero++;
		}
	}
	serializar(produto, id){
		const nome=String(produto.nome).trim(), categoria=String(produto.categoria).trim();
		const preco=Number(produto.preco), estoque=Number(produto.estoque);
		if(nome.length<2||nome.length>80)throw Error("O nome deve ter entre 2 e 80 caracteres.");
		if(categoria.length<2||categoria.length>50)throw Error("A categoria deve ter entre 2 e 50 caracteres.");
		if(!Number.isFinite(preco)||preco<0)throw Error("Preço inválido.");
		if(!Number.isInteger(estoque)||estoque<0)throw Error("Estoque inválido.");
		const nb=codificador.encode(nome), cb=codificador.encode(categoria), tamanhoRegistro=4+2+nb.length+2+cb.length+8+4;
		const registro=new Uint8Array(tamanhoRegistro+3), visao=this.visao(registro);
		let p=0;
		registro[p++]=ATIVO;
		visao.setUint16(p, tamanhoRegistro, true);
		p+=2;
		visao.setUint32(p, id, true);
		p+=4;
		visao.setUint16(p, nb.length, true);
		p+=2;
		registro.set(nb, p);
		p+=nb.length;
		visao.setUint16(p, cb.length, true);
		p+=2;
		registro.set(cb, p);
		p+=cb.length;
		visao.setFloat64(p, preco, true);
		p+=8;
		visao.setUint32(p, estoque, true);
		return registro;
	}
	desserializar(registro){
		const visao=this.visao(), end=registro.posicao+3+registro.tamanhoConteudo;
		let p=registro.posicao+3;
		const need=n=>{
			if(p+n>end)throw Error("Registro corrompido.")
		};
		need(4);
		const id=visao.getUint32(p, true);
		p+=4;
		need(2);
		const nl=visao.getUint16(p, true);
		p+=2;
		need(nl);
		const nome=decodificador.decode(this.bytes.slice(p, p+nl));
		p+=nl;
		need(2);
		const cl=visao.getUint16(p, true);
		p+=2;
		need(cl+12);
		const categoria=decodificador.decode(this.bytes.slice(p, p+cl));
		p+=cl;
		const preco=visao.getFloat64(p, true);
		p+=8;
		const estoque=visao.getUint32(p, true);
		return{
			id, nome, categoria, preco, estoque
		};
	}
	localizar(id){
		let encontrado=null;
		this.percorrer(r=>{
			if(r.lapide===ATIVO&&this.visao().getUint32(r.posicao+3, true)===id){
				encontrado=r; return false
			}
		});
		return encontrado;
	}
	inserir(produto){
		const id=this.visao().getUint32(0, true)+1, registro=this.serializar(produto, id), proximo=new Uint8Array(this.bytes.length+registro.length);
		proximo.set(this.bytes);
		proximo.set(registro, this.bytes.length);
		this.visao(proximo).setUint32(0, id, true);
		this.bytes=proximo;
		this.salvar();
		return id;
	}
	alterar(id, produto){
		const antigo=this.localizar(id);
		if(!antigo)throw Error("Produto não encontrado.");
		const registro=this.serializar(produto, id), novoTamanho=registro.length-3;
		if(novoTamanho<=antigo.tamanhoConteudo){
			const proximo=this.bytes.slice();
			proximo.fill(0, antigo.posicao+3, antigo.posicao+antigo.tamanhoTotal);
			proximo.set(registro.slice(3), antigo.posicao+3);
			this.bytes=proximo;
		} else{
			const proximo=new Uint8Array(this.bytes.length+registro.length);
			proximo.set(this.bytes);
			proximo[antigo.posicao]=EXCLUIDO;
			proximo.set(registro, this.bytes.length);
			this.bytes=proximo;
		}
		this.salvar();
	}
	excluir(id){
		const registro=this.localizar(id);
		if(!registro)throw Error("Produto não encontrado.");
		this.bytes=this.bytes.slice();
		this.bytes[registro.posicao]=EXCLUIDO;
		this.salvar();
	}
	visitar(visitor, incluirExcluidos=true, consulta=""){
		const q=String(consulta).trim().toLowerCase();
		this.percorrer(registro=>{
			if(!incluirExcluidos&&registro.lapide===EXCLUIDO)return; try{
				const produto=this.desserializar(registro), corresponde=!q||String(produto.id)===q||produto.nome.toLowerCase().includes(q)||produto.categoria.toLowerCase().includes(q); if(corresponde)visitor(produto, {
					...registro, excluidos: registro.lapide===EXCLUIDO
				});
			} catch{
			}
		});
	}
	compactar(){
		let tamanhoRegistro=TAMANHO_CABECALHO;
		this.percorrer(r=>{
			if(r.lapide===ATIVO)tamanhoRegistro+=r.tamanhoTotal
		});
		const proximo=new Uint8Array(tamanhoRegistro);
		proximo.set(this.bytes.slice(0, TAMANHO_CABECALHO));
		let p=TAMANHO_CABECALHO;
		this.percorrer(r=>{
			if(r.lapide===ATIVO){
				proximo.set(this.bytes.slice(r.posicao, r.posicao+r.tamanhoTotal), p); p+=r.tamanhoTotal
			}
		});
		this.bytes=proximo;
		this.salvar();
	}
	estatisticas(){
		let ativos=0, excluidos=0;
		this.percorrer(r=>r.lapide===ATIVO?ativos++: excluidos++);
		return{
			bytes: this.bytes.length, ativos, excluidos, proximo: this.visao().getUint32(0, true)+1
		};
	}
	mapa(){
		const campos=new Uint8Array(this.bytes.length), estados=new Uint8Array(this.bytes.length), registros=new Uint16Array(this.bytes.length);
		campos.fill(CAMPO.TAMANHO_CABECALHO, 0, TAMANHO_CABECALHO);
		const visao=this.visao(), pintar=(inicio, comprimento, campo, estado, numero)=>{
			campos.fill(campo, inicio, inicio+comprimento);
			estados.fill(estado, inicio, inicio+comprimento);
			registros.fill(numero, inicio, inicio+comprimento);
		};
		this.percorrer(r=>{
			const estado=r.lapide===EXCLUIDO?2: 1, end=r.posicao+r.tamanhoTotal; let p=r.posicao+3; pintar(r.posicao, 1, CAMPO.TOMB, estado, r.numero); pintar(r.posicao+1, 2, CAMPO.LENGTH, estado, r.numero); pintar(p, 4, CAMPO.ID, estado, r.numero); p+=4; const nl=visao.getUint16(p, true); pintar(p, 2+nl, CAMPO.NAME, estado, r.numero); p+=2+nl; const cl=visao.getUint16(p, true); pintar(p, 2+cl, CAMPO.CATEGORY, estado, r.numero); p+=2+cl; pintar(p, 8, CAMPO.PRICE, estado, r.numero); p+=8; pintar(p, 4, CAMPO.STOCK, estado, r.numero); p+=4; if(p<end)pintar(p, end-p, CAMPO.PADDING, estado, r.numero);
		});
		return{
			campos, estados, registros
		};
	}
}
const arquivo=new ArquivoBinario(), $=id=>document.getElementById(id);
const elementos={
	formulario: $("product-form"), id: $("product-id"), nome: $("name"), categoria: $("category"), preco: $("price"), estoque: $("stock"), titulo: $("form-title"), botaoSalvar: $("submit-button"), botaoCancelar: $("cancel-edit"), nota: $("operation-note"), busca: $("search"), linhas: $("product-rows"), vazio: $("empty-state"), total: $("result-count"), decodificados: $("decoded-records"), grade: $("byte-grid"), inspetor: $("byte-inspector"), tamanho: $("file-size"), compactar: $("compact-button"), aviso: $("toast")
};
const nomesCampos={
	1: "Cabeçalho", 2: "Lápide", 3: "Tamanho", 4: "ID", 5: "Nome", 6: "Categoria", 7: "Preço", 8: "Estoque", 9: "Vazio"
};
const classesCampos={
	1: "field-header", 2: "field-tombstone", 3: "field-length", 4: "field-id", 5: "field-name", 6: "field-category", 7: "field-price", 8: "field-stock", 9: "field-padding"
};
let temporizadorAviso;
function mostrarAviso(mensagem){
	clearTimeout(temporizadorAviso);
	elementos.aviso.textContent=mensagem;
	elementos.aviso.classList.add("visivel");
	temporizadorAviso=setTimeout(()=>elementos.aviso.classList.remove("visivel"), 2500);
}
function lerFormulario(){
	return{
		nome: elementos.nome.value, categoria: elementos.categoria.value, preco: elementos.preco.value, estoque: Number(elementos.estoque.value)
	}
}
function limparFormulario(){
	elementos.formulario.reset();
	elementos.nome.value=elementos.categoria.value=elementos.preco.value=elementos.estoque.value="";
	elementos.id.value="";
	elementos.titulo.textContent="Novo produto";
	elementos.botaoSalvar.textContent="Salvar produto";
	elementos.botaoCancelar.classList.add("hidden");
	elementos.nota.textContent="O registro será gravado diretamente no vetor de bytes.";
}
function criarCelula(texto){
	const td=document.createElement("td");
	td.textContent=texto;
	return td
}
function renderizarTabela(){
	elementos.linhas.replaceChildren();
	let total=0;
	arquivo.visitar(produto=>{
		total++; const tr=document.createElement("tr"); tr.append(criarCelula("#"+produto.id), criarCelula(produto.nome), criarCelula(produto.categoria), criarCelula(formatadorMoeda.format(produto.preco)), criarCelula(produto.estoque)); const acoes=document.createElement("td"); const idEdicao=document.createElement("button"); idEdicao.className="action"; idEdicao.textContent="Editar"; idEdicao.dataset.idEdicao=produto.id; const idExclusao=document.createElement("button"); idExclusao.className="action delete"; idExclusao.textContent="Excluir"; idExclusao.dataset.delete=produto.id; acoes.append(idEdicao, idExclusao); tr.append(acoes); elementos.linhas.append(tr);
	}, false, elementos.busca.value);
	elementos.vazio.style.display=total?"none": "block";
	elementos.vazio.textContent=elementos.busca.value.trim()?"Nenhum resultado.": "Nenhum produto cadastrado.";
	elementos.total.textContent=total+(total===1?" produto encontrado": " produtos encontrados");
}
function criarCartaoRegistro(produto, registro){
	const card=document.createElement("article");
	card.className="record"+(registro.excluidos?" deleted": "");
	const cabecalho=document.createElement("div");
	cabecalho.className="record-head";
	cabecalho.innerHTML="<b>Registro "+registro.numero+" · Produto #"+produto.id+"</b><span>"+(registro.excluidos?"EXCLUÍDO": "ATIVO")+"</span>";
	const gradeRegistro=document.createElement("div");
	gradeRegistro.className="record-grid";
	["Nome: "+produto.nome, "Categoria: "+produto.categoria, "Preço: "+formatadorMoeda.format(produto.preco), "Estoque: "+produto.estoque].forEach(texto=>{
		const span=document.createElement("span"); span.textContent=texto; span.title=texto; gradeRegistro.append(span);
	});
	card.append(cabecalho, gradeRegistro);
	return card;
}
function renderizarRegistros(){
	elementos.decodificados.replaceChildren();
	let total=0;
	arquivo.visitar((produto, registro)=>{
		total++; elementos.decodificados.append(criarCartaoRegistro(produto, registro))
	});
	if(!total){
		const p=document.createElement("p");
		p.className="decoded-empty";
		p.textContent="Cadastre um produto para visualizar os valores.";
		elementos.decodificados.append(p)
	}
}
function valorLegivel(campo, produto, registro){
	if(campo===CAMPO.TOMB)return registro.excluidos?"2A — excluído": "20 — ativo";
	if(campo===CAMPO.LENGTH)return registro.tamanhoConteudo+" bytes";
	if(campo===CAMPO.ID)return"#"+produto.id;
	if(campo===CAMPO.NAME)return produto.nome;
	if(campo===CAMPO.CATEGORY)return produto.categoria;
	if(campo===CAMPO.PRICE)return formatadorMoeda.format(produto.preco);
	if(campo===CAMPO.STOCK)return produto.estoque+" unidades";
	return"preenchimento";
}
function descreverByte(posicao, campo, estados, numero){
	if(campo===CAMPO.TAMANHO_CABECALHO)return posicao<4?"Último ID: "+(arquivo.estatisticas().proximo-1): "Lista de espaços vazios: -1";
	let texto="Registro "+numero;
	arquivo.visitar((produto, registro)=>{
		if(registro.numero===numero)texto=nomesCampos[campo]+": "+valorLegivel(campo, produto, registro)+" — registro "+numero+(estados===2?" excluído": " ativo")
	});
	return texto;
}
function inspecionarByte(posicao, mapa){
	const strong=elementos.inspetor.querySelectorAll("b"), campo=mapa.campos[posicao], estados=mapa.estados[posicao], numero=mapa.registros[posicao];
	strong[0].textContent=posicao.toString(16).toUpperCase().padStart(4, "0");
	strong[1].textContent=arquivo.bytes[posicao];
	strong[2].textContent=nomesCampos[campo];
	elementos.inspetor.querySelector("p").textContent=descreverByte(posicao, campo, estados, numero);
}
function renderizarBytes(){
	const mapa=arquivo.mapa(), fragmento=document.createDocumentFragment();
	arquivo.bytes.forEach((valor, posicao)=>{
		const botao=document.createElement("button"), campo=mapa.campos[posicao]; botao.className="byte "+classesCampos[campo]+(mapa.estados[posicao]===2?" deleted": ""); botao.textContent=valor.toString(16).toUpperCase().padStart(2, "0"); botao.dataset.posicao=posicao; botao.setAttribute("aria-label", "Byte "+posicao+", campo "+nomesCampos[campo]); fragmento.append(botao);
	});
	elementos.grade.replaceChildren(fragmento);
	elementos.tamanho.textContent=arquivo.bytes.length+" bytes";
	inspecionarByte(0, mapa);
}
function renderizarIndicadores(){
	const s=arquivo.estatisticas();
	$("stat-bytes").textContent=s.bytes;
	$("stat-active").textContent=s.ativos;
	$("stat-deleted").textContent=s.excluidos;
	$("stat-next").textContent=s.proximo;
	elementos.compactar.disabled=!s.excluidos;
}
function renderizar(){
	renderizarIndicadores();
	renderizarTabela();
	renderizarRegistros();
	renderizarBytes()
}
elementos.formulario.addEventListener("submit", evento=>{
	evento.preventDefault(); try{
		if(elementos.id.value){
			arquivo.alterar(Number(elementos.id.value), lerFormulario()); mostrarAviso("Produto atualizado.");
		} else{
			const id=arquivo.inserir(lerFormulario()); mostrarAviso("Produto #"+id+" cadastrado.");
		}
		limparFormulario(); renderizar();
	} catch(erro){
		mostrarAviso(erro.message)
	}
});
elementos.linhas.addEventListener("click", evento=>{
	const idEdicao=evento.target.dataset.idEdicao, idExclusao=evento.target.dataset.delete; if(idEdicao){
		arquivo.visitar(produto=>{
			if(produto.id===Number(idEdicao)){
				elementos.id.value=produto.id; elementos.nome.value=produto.nome; elementos.categoria.value=produto.categoria; elementos.preco.value=produto.preco; elementos.estoque.value=produto.estoque
			}
		}, false); elementos.titulo.textContent="Editar produto #"+idEdicao; elementos.botaoSalvar.textContent="Atualizar produto"; elementos.botaoCancelar.classList.remove("hidden"); elementos.nota.textContent="O registro será sobrescrito ou realocado."; elementos.nome.focus();
	}
	if(idExclusao&&confirm("Excluir este produto?")){
		arquivo.excluir(Number(idExclusao)); limparFormulario(); renderizar(); mostrarAviso("Produto excluído logicamente.")
	}
});
elementos.botaoCancelar.addEventListener("click", limparFormulario);
elementos.busca.addEventListener("input", renderizarTabela);
elementos.grade.addEventListener("mouseover", evento=>{
	if(evento.target.dataset.posicao!==undefined)inspecionarByte(Number(evento.target.dataset.posicao), arquivo.mapa())
});
elementos.grade.addEventListener("focusin", evento=>{
	if(evento.target.dataset.posicao!==undefined)inspecionarByte(Number(evento.target.dataset.posicao), arquivo.mapa())
});
elementos.compactar.addEventListener("click", ()=>{
	if(confirm("Remover fisicamente os registros excluídos?")){
		arquivo.compactar(); renderizar(); mostrarAviso("Arquivo compactado.")
	}
});
$("reset-button").addEventListener("click", ()=>{
	if(confirm("Limpar todos os dados?")){
		arquivo.reiniciar(); limparFormulario(); renderizar(); mostrarAviso("Arquivo limpo.")
	}
});
window.addEventListener("storage", ()=>location.reload());
renderizar();
