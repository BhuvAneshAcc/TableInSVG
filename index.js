
class Table {
    constructor({ selects, data, columns,columnwidth,tableColor,textStyle, title, allowPagination, rowsPerPage }) {
        this.selects = selects;
        this.data = [...data];
        this.filteredData = [...data];
        this.originalData = [...data];
        this.columns = columns;
        this.title = title;
        this.tableColor=tableColor;
        this.columnwidth=columnwidth;
        this.textStyle=textStyle;
        this.allowPagination = allowPagination;
        this.rowsPerPage = rowsPerPage;
        this.svg = d3.select(selects);
        this.gap = 2;
        this.lineGap = 0.3;
        this.cellPadding = 13;
        this.lineHeight = 18;
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortState = 'none';
        this.container = d3.select(".container");

        this.createTableHeader();
        this.createBottomTableContainer();

        this.createTable();
        if (allowPagination) {
            this.createPagination();
        }
        window.addEventListener('resize', this.handleresize.bind(this));

    }

    createTableHeader() {
        const containerHead = this.container
        .insert("div", ":first-child")
        .attr("class", "container_head")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "space-between")
        .style("margin-bottom", "5px");

    containerHead.append("h2")
        .attr("class", "title_table")
        .style("width", "100%")
        .style("font-size", "clamp(12px, 2vw, 25px)")
        .style("color", "#444")
        .style("font-family", (this.textStyle && this.textStyle.fontStyle)?this.textStyle.fontStyle:"Arial, sans-serif")
        .text(this.title);   

        const searchDiv =containerHead.append("div")
        .attr("class", "search-bar")
        .style("display", "flex")
        .style("align-items", "center");

    const searchInput = searchDiv.append("input")
        .attr("type", "text")
        .attr("placeholder", "Search")
        .style("font-size", "clamp(6px, 1.6vw, 12px)")
        .style("padding", "0.8vmax")
        .style("padding-left", "2vw")
        .style("width", "15vw")
        .on("mouseover", function () {
            d3.select(this).style("border", "1px solid black");
        })
        .on("mouseout", function () {
            d3.select(this).style("border", "1px solid lightgray");
        })
        .style("border-radius", "50px")
        .style("border", "1px solid lightgray");

    searchInput.on("input", () => {
        const searchTerm = searchInput.property("value").toLowerCase();
        this.filteredData = this.data.filter(row =>
            Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm))
        );
        this.currentPage = 1;
        this.createTable();
        if (this.allowPagination) {
            this.createPagination();
        }
    });    }

    createBottomTableContainer() {

        const bottomTableContainer = this.container.append("div")
        .attr("class", "bottom_table_container")
        .style("display", "flex")
        .style("justify-content", "space-between")
        .style("align-items", "center")
        .style("margin-top", "1.5vw");

    const rowsPerPagePaginationContainer = bottomTableContainer.append("div")
        .attr("class", "rows_Per_Page_pagination")
        .style("display", "flex")
        .style("margin-top", "5px")
        .style("align-items", "center");

    const rowPerPageDiv = rowsPerPagePaginationContainer.append("div")
        .attr("class", "rows_Per_Page")
        .style("display", "flex")
        .style("font-size", "clamp(12px, 1.5vw, 16px)")
        .style("align-items", "center");

    rowPerPageDiv.append("label")
        .attr("for", "rows_Per_Page")
        .text("Rows Per Page: ")
        .style("margin-right", "5px")
        .style("color", "#444")
        .style("font-family", "sans-serif");

    const select = rowPerPageDiv.append("div")
        .attr("id", "rows_Per_Page_div")
        .append("select")
        .attr("id", "rows_Per_Page")
        .style("padding", "0.5vmin")
        .style("cursor", "pointer")
        .on("mouseover", function () {
            d3.select(this).style("background-color", "lightgray");
        })
        .on("mouseout", function () {
            d3.select(this).style("background-color", "white");
        })
        .style("border-radius", "5px");

    const rowsPerPageOptions = ["All", 5, 10, 20];
    if (!rowsPerPageOptions.includes(this.rowsPerPage)) {
        rowsPerPageOptions.push(this.rowsPerPage);
        rowsPerPageOptions.sort((a, b) => a - b);
    }

    select.selectAll("option")
        .data(rowsPerPageOptions)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d === "All" ? this.data.length : d)
        .property("selected", d => d === this.rowsPerPage);

    select.on("change", () => {
        this.rowsPerPage = select.property("value") === String(this.data.length) ? this.data.length : +select.property("value");
        if (this.rowsPerPage === this.data.length) {
            this.container.select(".scrollbar_container")
                .style("height", "570px")
                .style("overflow", "auto");
        } else if (this.rowsPerPage > 10) {
            this.container.select(".scrollbar_container")
                .style("height", "570px")
                .style("overflow", "auto");
        } else {
            this.container.select(".scrollbar_container")
                .style("height", "auto")
                .style("overflow", "hidden");
        }
        if (this.allowPagination) {
            this.createPagination();
        }
        this.createTable();
    }); 
    bottomTableContainer.append("div")
                        .attr("class","pagination_container");
}


    calculateColumnWidths() {
        const tempSVG = this.svg.append("g").attr("class", "temp").attr("opacity", 0);
        const padding = 60;
        const columnWidths = this.columns.map(column => {
            const headerText = tempSVG.append("text").text(column.name);
            const headerWidth = headerText.node().getBBox().width + padding;

            const maxContentWidth = d3.max(this.filteredData, row => {
                const contentText = tempSVG.append("text").text(row[column.name]);
                const contentWidth = contentText.node().getBBox().width;
                contentText.remove();
                return contentWidth + padding;
            });

            headerText.remove();
            return Math.max(headerWidth, maxContentWidth);
        });

        tempSVG.remove();
        if(this.columnwidth){
            return this.columnwidth;
        }
        else{
        return columnWidths;
        }
    }

    updateSVGDimensions() {
                const containerWidth = this.container.node().clientWidth;
                const calculatedWidths = this.calculateColumnWidths(this.filteredData, this.columns);
                const totalTableWidth = d3.sum(calculatedWidths) + (this.columns.length - 1) * this.gap;
                if(this.columnwidth){
                    if(totalTableWidth < containerWidth){
                        const remainSpace=(containerWidth-totalTableWidth)/this.columns.length;
                        for(let i=0;i<calculatedWidths.length;i++){
                                calculatedWidths[i]+=remainSpace;
                        }
                        this.container.select(".scrollbar_container").style("overflow-x", "hidden");

                    }
                    else{
                        this.container.select(".scrollbar_container").style("overflow-x", "scroll");

                    }
                }
                else{
            
                if (totalTableWidth < containerWidth) {
                    const remainingSpace = containerWidth - totalTableWidth;
            
                    const variance = this.columns.map((column) => {
                        const uniqueLengths = new Set(this.originalData.map(row => String(row[column.name]).length)).size;
                        return uniqueLengths > 1 ? 1 : 0; 
                    });
            
                    const varyingColumns = variance.reduce((sum, val) => sum + val, 0);
                    const extraWidthForVaryingColumns = remainingSpace / varyingColumns;
                    let accumulatedWidth = 0;
            
                    for (let i = 0; i < calculatedWidths.length; i++) {
                        if (variance[i]) {
                            calculatedWidths[i] += extraWidthForVaryingColumns;
                            accumulatedWidth += extraWidthForVaryingColumns;
                        }
                    }
            
                    this.container.select(".scrollbar_container").style("overflow-x", "hidden");
                } else {
                    this.container.select(".scrollbar_container").style("overflow-x", "scroll");
                }
            }
            
                this.svg.attr("width", Math.max(totalTableWidth, containerWidth));
            
                return { svgWidth: Math.max(totalTableWidth, containerWidth), calculatedWidths};
            }
    createTable() {
    const { calculatedWidths } = this.updateSVGDimensions();
    this.svg.selectAll("*").remove();
    const headerGroup = this.svg.append("g").attr("class", "header");
    let X = 0;
    const self = this; 

    this.columns.forEach((header, i) => {
        headerGroup.append("rect")
            .attr("x", X)
            .attr("y", 0)
            .attr("width", calculatedWidths[i])
            .attr("height", 50)
            .attr("fill", (this.tableColor && this.tableColor.headerColor)?this.tableColor.headerColor:"lightgray")
            .attr("rx", 5)
            .attr("ry", 5);

        headerGroup.append("text")
            .attr("x", X + this.cellPadding)
            .attr("y", this.lineHeight * 1.5)
            .text(header.name)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .style("font-family", (this.textStyle && this.textStyle.fontStyle)?this.textStyle.fontStyle:"Arial, sans-serif")
            .attr("font-weight", "500")
            .attr("font-size", "clamp(10px, 1.2vw, 16px)");

        if (header.sortable) {
            this.svg.append("text")
                .attr("x", X + calculatedWidths[i] - 25)
                .attr("y", this.lineHeight * 1.5 + 4)
                .text(this.sortColumn === header.name ? (this.sortState === 'asc' ? '▲' : (this.sortState === 'desc' ? '▼' : '⇅')) : '⇅')
                .attr("font-size", "clamp(10px, 1.2vw, 16px)")
                .style("fill", "rgb(36, 37, 37)")
                .style("cursor", 'pointer')
                .on("mouseover", function () {
                    d3.select(this)
                        .attr("stroke", "rgb(70, 72, 72)")
                        .attr("stroke-width", 1);
                })
                .on("mouseout", function () {
                    d3.select(this).attr("stroke", "");
                })
                .on("click", () => {
                    self.sortTable(header.name); 
                });
        }

        X += calculatedWidths[i] + this.gap;
    });

    if (this.filteredData.length === 0) {
        this.svg.append("text")
            .attr("x", this.container.node().clientWidth / 2)
            .attr("y", 100)
            .attr("text-anchor", "middle")
            .style("font-family", "Arial, sans-serif")
            .style("font-size", "clamp(12px, 1.2vw, 16px)")
            .text("No results found");
        return;
    }

    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = this.currentPage * this.rowsPerPage;
    const alterData = this.filteredData.slice(start, end);

    let currentY = this.lineHeight * 1.5 + 5;

    const rows = this.svg.selectAll("g.row")
        .data(alterData)
        .enter()
        .append("g")
        .attr("class", "row")
        .attr("transform", (d, i) => `translate(0, ${currentY})`)
        .on("mouseover", function () {
            d3.select(this).selectAll("rect").style("opacity", 0.5);
        })
        .on("mouseout", function () {
            d3.select(this).selectAll("rect").style("opacity", 1);
            d3.select(this).selectAll("text").style("opacity", 1);
        });

    rows.each(function (d) {
        const currentRow = d3.select(this);
        const cellData = self.columns.map(header => d[header.name] !== undefined ? d[header.name] : "");
        let maxCellHeight = 0;

        cellData.forEach((cell, i) => {
            const x = i * (calculatedWidths[i] + self.gap);
            const tempText = self.svg.append("text") 
                .attr("x", x + self.cellPadding)
                .attr("y", 0)
                .text(cell)
                .call(wrapText, calculatedWidths[i] - 2 * self.cellPadding);

            const cellHeight = tempText.node().getBBox().height;

            if (cellHeight > maxCellHeight) {
                maxCellHeight = cellHeight;
            }

            tempText.remove();
        });

        let z = 0;
        cellData.forEach((cell, i) => {
            const rowRect = currentRow.append("rect")
                .attr("x", z)
                .attr("y", 20)
                .attr("width", calculatedWidths[i])
                .attr("height", maxCellHeight + 2 * self.cellPadding)
                .attr("fill", (self.tableColor && self.tableColor.rowColor)?self.tableColor.rowColor:"#fff")
                .attr("rx", 5)
                .attr("ry", 5);

            if (self.columns[i].sortable && self.sortColumn === self.columns[i].name && self.sortState !== 'none') {
                rowRect.style("filter", "drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.3))");
            }

            currentRow.append("text")
                .attr("x", typeof cell === 'number' ? z + calculatedWidths[i] / 2 : z + self.cellPadding)
                .attr("y", self.cellPadding + self.lineHeight + 15)
                .text(cell)
                .call(wrapText.bind(self), calculatedWidths[i] - 2 * self.cellPadding)
                .attr("text-anchor", typeof cell === 'number' ? "middle" : "start")
                .style("font-family", (self.textStyle && self.textStyle.fontStyle)?self.textStyle.fontStyle:"Arial, sans-serif")
                .style("font-size", "clamp(10px, 1vw, 14px)")
                .style("text-align", "center");

            z += calculatedWidths[i] + self.gap;
        });

        currentY += maxCellHeight + self.gap + 2 * self.cellPadding;
        d3.select(this).attr("transform", `translate(0, ${currentY - maxCellHeight - self.gap - 2 * self.cellPadding})`);
    });

    function wrapText(text, width) {
        text.each(function () {
            const textElement = d3.select(this);
            const words = breakWords(textElement.text(), width);
            let word;
            let line = [];
            const lineHeight = 1.1;
            const y = textElement.attr("y");
            const x = textElement.attr("x");
            let tspan = textElement.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", "0em");

            while ((word = words.pop())) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = textElement.append("tspan").attr("x", x).attr("dy", `${self.lineHeight + self.lineGap}em`).text(word); // Use `self`
                }
            }
        });
    }

    function breakWords(text, width) {
        const words = text.split(/\s+/);
        const brokenWords = [];
        words.forEach(word => {
            let currentWord = word;
            while (currentWord.length) {
                const fragment = currentWord.slice(0, Math.floor(width / 8)); 
                brokenWords.push(fragment);
                currentWord = currentWord.slice(fragment.length);
            }
        });
        return brokenWords.reverse();  
    }

    const totalHeight = currentY + 40;  
    console.log(totalHeight + "height");
    this.svg.attr("height", totalHeight);  
}

    sortTable(columnName){


if (this.sortColumn !== columnName) {
    this.sortState = 'none';
}
this.sortColumn = columnName;

switch (this.sortState) {
    case 'none':
        this.sortState = 'asc';
        this.filteredData.sort((a, b) => d3.ascending(a[columnName], b[columnName]));
        break;
    case 'asc':
        this.sortState = 'desc';
        this.filteredData.sort((a, b) => d3.descending(a[columnName], b[columnName]));
        break;
    case 'desc':
        this.sortState = 'none';
        this.filteredData = [...this.originalData];
        break;
}

this.createTable();    
}
createPagination() {
    const self = this; 

    const totalPages = Math.ceil(self.filteredData.length / self.rowsPerPage);
    if (self.container.select(".pagination_container").empty()) {
    self.container.append("div").attr("class", "pagination_container");
}

    const pagination = self.container.select(".pagination_container");
    pagination.selectAll("*").remove();

    const createPageButton = (pageNumber) => {
        pagination.append("span")
            .attr("class", "Pagination")
            .style("cursor", "pointer")
            .style("background-color", pageNumber === self.currentPage ? "#e0e0e0" : "#ffffff")
            .style("border", pageNumber === self.currentPage ? "1px solid #444" : "1px solid #ddd")
            .style("padding", "0.8vw")
            .style("margin", "2.4px")
            .style("color", "#444")
            .style("border-radius", "5px")
            .style("font-size", "2vmin")
            .style("font-weight", pageNumber === self.currentPage ? "bold" : "normal")
            .style("font-family", "Arial, sans-serif")
            .style("text-align", "center")
            .on("mouseover", function () {
                d3.select(this).style("background-color", "#d0d0d0");
            })
            .on("mouseout", function () {
                d3.select(this).style("background-color", pageNumber === self.currentPage ? "#e0e0e0" : "#f9f9f9");
            })
            .on("click", () => {
                self.currentPage = pageNumber;
                self.createTable();
                self.createPagination();
            })
            .append("tspan")
            .text(pageNumber);
    };

     pagination.append("span")
        .attr("class", "Pagination")
        .style("cursor", self.currentPage > 1 ? "pointer" : "default")
        .style("border", "1px solid #ddd")
        .style("padding", "0.8vw")
        .style("background-color", "#f9f9f9")
        .style("margin", "2.4px")
        .style("border-radius", "5px")
        .style("font-size", "2vmin")
        .style("font-weight", "normal")
        .style("font-family", "Arial, sans-serif")
        .style("text-align", "center")
        .on("mouseover", function() {
            if (self.currentPage > 1) {
                d3.select(this).style("background-color", "#d0d0d0");
            }
        })
        .on("mouseout", function(){
            d3.select(this).style("background-color", "#f9f9f9");
        })
        .on("click", () => {
            if (self.currentPage > 1) {
                self.currentPage--;
                self.createTable();
                self.createPagination();
            }
        })
        .append("tspan")
        .text("Previous")
        .style("color", self.currentPage === 1 ? "rgba(0, 0, 0, 0.375)" : "#333");

     if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
            createPageButton(i);
        }
    } else {
        createPageButton(1);
        const startPage = Math.max(2, self.currentPage - 1);
        const endPage = Math.min(totalPages - 1, self.currentPage + 1);

        if (self.currentPage > 3) {
            if (startPage > 2) {
                pagination.append("span")
                    .attr("class", "Pagination")
                    .style("background-color", "#f9f9f9")
                    .style("padding", "0.8vw")
                    .style("margin", "2.4px")
                    .style("border", "1px solid #ddd")
                    .style("text-align", "center")
                    .text("...");
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            createPageButton(i);
        }

        if (self.currentPage < totalPages - 2) {
            if (endPage < totalPages - 1) {
                pagination.append("span")
                    .attr("class", "Pagination")
                    .style("background-color", "#f9f9f9")
                    .style("padding", "0.8vw")
                    .style("margin", "2.4px")
                    .style("border", "1px solid #ddd")
                    .style("text-align", "center")
                    .text("...");
            }
        }

        createPageButton(totalPages);
    }

     pagination.append("span")
        .attr("class", "Pagination")
        .style("cursor", self.currentPage < totalPages ? "pointer" : "default")
        .style("background-color", "#f9f9f9")
        .style("border", "1px solid #ddd")
        .style("padding", "0.8vw")
        .style("margin", "2.4px")
        .style("border-radius", "5px")
        .style("font-size", "2vmin")
        .style("font-weight", "normal")
        .style("font-family", "Arial, sans-serif")
        .style("text-align", "center")
        .on("mouseover", function(){
            if (self.currentPage < totalPages) {
                d3.select(this).style("background-color", "#d0d0d0");
            }
        })
        .on("mouseout", function(){
            d3.select(this).style("background-color", "#f9f9f9");
        })
        .on("click", () => {
            if (self.currentPage < totalPages) {
                self.currentPage++;
                self.createTable();
                self.createPagination();
            }
        })
        .append("span")
        .text("Next")
        .style("color", self.currentPage < totalPages ? "#333" : "rgba(0, 0, 0, 0.375)");
}

    if(allowPagination){
        createPagination();
    }
    handleresize() {
        this.updateSVGDimensions();
        this.createTable();
        if (this.allowPagination) {
            this.createPagination();
        }
    }
   
    
}
const input={selects: '#table',
    data:[
        { "Name": "Bhuvnaneshwar Kumar", "Age": 21, "Place": "Chennai", "PhoneNumber": 8248995718, "Email-id": "bhuv@gmail.com" },
        { "Name": "Nishant Siraj", "Age": 24, "Place": "Bangalore", "PhoneNumber": 7845123699, "Email-id": "nishant@gmail.com" },
       { "Name": "Ayesha", "Age": 30, "Place": "Mumbai", "PhoneNumber": 7896541236, "Email-id": "ayesha@gmail.com" },
       { "Name": "Joshwin Prathap", "Age": 25, "Place": "Odisha", "PhoneNumber": 9248414482, "Email-id": "joshwinraj@gmail.com" },
       { "Name": "Rajesh Kumar", "Age": 35, "Place": "Tenkasi", "PhoneNumber": 9003418837, "Email-id": "rajkumar1234@gmail.com" },
       { "Name": "JoshwinPrathap", "Age": 25, "Place": "Odisha", "PhoneNumber": 9248414482, "Email-id": "joshwinraj@gmail.com" },
       { "Name": "Rajesg Kumar", "Age": 35, "Place": "Tenkasi", "PhoneNumber": 9003418837, "Email-id": "rajkumar1234@gmail.com" },
       { "Name": "Joshwin Prathap", "Age": 25, "Place": "Odisha", "PhoneNumber": 9248414482, "Email-id": "joshwinraj@gmail.com" },
       { "Name": "Raj Kumar", "Age": 35, "Place": "Tenkasi", "PhoneNumber": 9003418837, "Email-id": "rajkumar1234@gmail.com" },
       { "Name": "Harish Kalyan", "Age": 55, "Place": "Karnataka", "PhoneNumber": 7725896001, "Email-id": "harishkalyan@gmail.com" },
       { "Name": "Joshwin Prathap", "Age": 25, "Place": "Odisha", "PhoneNumber": 9248414482, "Email-id": "joshwinraj@gmail.com" },
       { "Name": "Raj Kumar", "Age": 35, "Place": "Tenkasi", "PhoneNumber": 9003418837, "Email-id": "rajkumar1234@gmail.com" },
       { "Name": "Harish Kalyan", "Age": 55, "Place": "Karnataka", "PhoneNumber": 7725896001, "Email-id": "harishkalyan@gmail.com" },
       { "Name": "Joshwin Prathap", "Age": 25, "Place": "Odisha", "PhoneNumber": 9248414482, "Email-id": "joshwinraj@gmail.com" },
       { "Name": "Rajesh Kumar", "Age": 35, "Place": "Tenkasi", "PhoneNumber": 9003418837, "Email-id": "rajkumar1234@gmail.com" },
       { "Name": "JoshwinPrathap", "Age": 25, "Place": "Odisha", "PhoneNumber": 9248414482, "Email-id": "joshwinraj@gmail.com" },
       { "Name": "Rajesg Kumar", "Age": 35, "Place": "Tenkasi", "PhoneNumber": 9003418837, "Email-id": "rajkumar1234@gmail.com" },
       { "Name": "Joshwin Prathap", "Age": 25, "Place": "Odisha", "PhoneNumber": 9248414482, "Email-id": "joshwinraj@gmail.com" },
       { "Name": "Raj Kumar", "Age": 35, "Place": "Tenkasi", "PhoneNumber": 9003418837, "Email-id": "rajkumar1234@gmail.com" },
       { "Name": "Harish Kalyan", "Age": 55, "Place": "Karnataka", "PhoneNumber": 7725896001, "Email-id": "harishkalyan@gmail.com" },
       { "Name": "Joshwin Prathap", "Age": 25, "Place": "Odisha", "PhoneNumber": 9248414482, "Email-id": "joshwinraj@gmail.com" },
       { "Name": "Raj Kumar", "Age": 35, "Place": "Tenkasi", "PhoneNumber": 9003418837, "Email-id": "rajkumar1234@gmail.com" },
       { "Name": "Joshwin Prathap", "Age": 25, "Place": "Odisha", "PhoneNumber": 9248414482, "Email-id": "joshwinraj@gmail.com" },      
       { "Name": "Joshwin Prathap", "Age": 25, "Place": "Odisha", "PhoneNumber": 9248414482, "Email-id": "joshwinraj@gmail.com" },
       { "Name": "Rahul", "Age": 28, "Place": "Delhi", "PhoneNumber": 9876541230, "Email-id": "rahul@gmail.com" }
    ],
    columns:[
        { name: "Name", sortable: true },
        { name: "Age", sortable: true },
        { name: "Place", sortable: true },
        { name: "PhoneNumber", sortable: false },
        { name: "Email-id", sortable: false }
        
    ],
    columnwidth: false,
    tableColor:{headerColor:false,rowColor:false},
    textStyle:{fontStyle:false},
    title: "Personal Information",
    allowPagination: true,
    rowsPerPage: 10
};
const table = new Table(input);