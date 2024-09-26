function table({ selects, data, columns, title, allowPagination, rowsPerPage }) {
    let filteredData = [...data];
    let originalData = [...data]; 
    const svg = d3.select(selects);
    const gap = 2;
    const lineGap=0.3;
    const cellPadding = 13;
    const lineHeight = 18;
    let currentPage = 1;
    let sortColumn = null;
    let sortState = 'none'; 
    const container = d3.select(".container")
    const containerHead = container
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
        .style("font-family", "sans-serif")
        .text(title);

    const searchDiv = containerHead.append("div")
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
            d3.select(this)
                .style("border", "1px solid black");
        })
        .on("mouseout", function () {
            d3.select(this)
                .style("border", "1px solid lightgray");
        })
        .style("border-radius", "50px")
        .style("border", "1px solid lightgray");

    searchInput.on("input", function () {
        const searchTerm = this.value.toLowerCase();
        filteredData = data.filter(row =>
            Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm))
        );
        currentPage = 1;

        createTable();
        if (allowPagination) {
            createPagination();
        }
    });

    let rowsPerPageOptions = ["All",5, 10, 20];

    if (!rowsPerPageOptions.includes(rowsPerPage)) {
        rowsPerPageOptions.push(rowsPerPage);
        rowsPerPageOptions.sort((a, b) => a - b);
    }

    const bottomTableContainer = container
        .append("div")
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

    select.selectAll("option")
        .data(rowsPerPageOptions)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d ==="All"?data.length:d)
        .property("selected", d => d === rowsPerPage);

    bottomTableContainer.append("div")
        .attr("class", "pagination_container");

    if (rowsPerPage > 10) {
        container.select(".scrollbar_container")
            .style("position", "relative")
            .style("height", "570px")
            .style("overflow", "auto");
    } else {
        container.select(".scrollbar_container")
            .style("height", "auto")
            .style("overflow", "hidden");
    }
    container.select(".scrollbar_container")
             .style("widht","100%")
             .style("overflow","auto");

             function calculateColumnWidths(data, columns) {
                const tempSVG = svg.append("g").attr("class", "temp"); 
            
                const padding = 50; 
                const maxColumnWidth = 300; 
                const columnWidths = columns.map(column => {
                    const headerText = tempSVG.append("text").text(column.name);
                    const headerWidth = headerText.node().getBBox().width + padding;
            
                    const maxContentWidth = d3.max(data, row => {
                        const contentText = tempSVG.append("text").text(row[column.name]);
                        const contentWidth = contentText.node().getBBox().width;
                        contentText.remove();
                        return contentWidth + padding;
                    });
            
                    headerText.remove();
                    const finalWidth = Math.max(headerWidth, maxContentWidth);
                    return Math.min(finalWidth, maxColumnWidth); 
                });
                console.log(columnWidths);
                tempSVG.remove(); 
            
                return columnWidths;
            }
  
            
            function updateSVGSize() {
                const containerWidth = container.node().clientWidth;
                const calculatedWidths = calculateColumnWidths(filteredData, columns);
                const totalTableWidth = d3.sum(calculatedWidths) + (columns.length - 1) * gap;
            
                if (totalTableWidth < containerWidth) {
                    const remainingSpace = containerWidth - totalTableWidth;
            
                    const variance = columns.map((column) => {
                        const uniqueLengths = new Set(originalData.map(row => String(row[column.name]).length)).size;
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
            
                    container.select(".scrollbar_container").style("overflow-x", "hidden");
                } else {
                    container.select(".scrollbar_container").style("overflow-x", "scroll");
                }
            
                svg.attr("width", Math.max(totalTableWidth, containerWidth));
            
                return { svgWidth: Math.max(totalTableWidth, containerWidth), calculatedWidths};
            }   

    function createTable() {
           const { calculatedWidths } = updateSVGSize();
    svg.selectAll("*").remove(); 
    const headerGroup = svg.append("g").attr("class", "header");
    let X = 0;

    columns.forEach((header, i) => {
        headerGroup.append("rect")
            .attr("x", X)
            .attr("y", 0)
            .attr("width", calculatedWidths[i])
            .attr("height", 50)
            .attr("fill", "lightgray")
            .attr("rx", 5)
            .attr("ry", 5);

        headerGroup.append("text")
            .attr("x", X + cellPadding)
            .attr("y",lineHeight*1.5)
            .text(header.name)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .style("font-family", "Arial, sans-serif")
            .attr("font-weight", "500")
            .attr("font-size", "clamp(10px, 1.2vw, 16px)");

        if (header.sortable) {
            const sortSymbol = svg.append("text")
                .attr("x", X + calculatedWidths[i] - 25)
                .attr("y", lineHeight*1.5 +4)
                .text(sortColumn === header.name ? (sortState === 'asc' ? '▲' : (sortState === 'desc' ? '▼' : '⇅')) : '⇅')
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
                    sortTable(header.name);
                });
        }

        X += calculatedWidths[i] + gap;
    });

    if (filteredData.length === 0) {
        svg.append("text")
            .attr("x", container.node().clientWidth / 2)
            .attr("y", 100)
            .attr("text-anchor", "middle")
            .style("font-family", "Arial, sans-serif")
            .style("font-size", "clamp(12px, 1.2vw, 16px)")
            .text("No results found");
        return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const end = currentPage * rowsPerPage;
    const alterData = filteredData.slice(start, end);

    let currentY = lineHeight * 1.5 + 5;

    const rows = svg.selectAll("g.row")
        .data(alterData)
        .enter()
        .append("g")
        .attr("class", "row")
        .attr("transform", (d, i) => `translate(0, ${currentY})`)
        .each(function(d) {
            const currentRow = d3.select(this);
            const cellData = columns.map(header => d[header.name] !== undefined ? d[header.name] : "");
            let maxCellHeight = 0;

            cellData.forEach((cell, i) => {
                const x = i * (calculatedWidths[i] + gap);
                const tempText = svg.append("text")
                    .attr("x", x + cellPadding)
                    .attr("y", 0)
                    .text(cell)
                    .call(wrapText, calculatedWidths[i] - 2 * cellPadding);

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
                    .attr("height", maxCellHeight + 2 * cellPadding)
                    .attr("fill", "#fff")
                    .attr("rx", 5)
                    .attr("ry", 5)
                    if (columns[i].sortable && sortColumn === columns[i].name && sortState !== 'none') {
                        rowRect.style("filter", "drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.3))");
                    }

                currentRow.append("text")
                    .attr("x", typeof cell === 'number' ? z + calculatedWidths[i] / 2 : z + cellPadding)
                    .attr("y", cellPadding + lineHeight + 15)
                    .text(cell)
                    .call(wrapText, calculatedWidths[i] - 2 * cellPadding)
                    .attr("text-anchor", typeof cell === 'number' ? "middle" : "start")
                    .style("font-family", "Arial, sans-serif")
                    .style("font-size", "clamp(10px, 1vw, 14px)")
                    .style("text-align", "center");


                z += calculatedWidths[i] + gap;
            });

            currentY += maxCellHeight + gap + 2 * cellPadding;
            d3.select(this).attr("transform", `translate(0, ${currentY - maxCellHeight - gap - 2 * cellPadding})`);
        });

        function wrapText(text, width) {
            text.each(function() {
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
                        tspan = textElement.append("tspan").attr("x", x).attr("dy", `${lineHeight+lineGap}em`).text(word);
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
        svg.attr("height", totalHeight);

}

    function sortTable(columnName) {
        if (sortColumn !== columnName) {
            sortState = 'none'; 
        }
        sortColumn = columnName;
        
        switch (sortState) {
            case 'none':
                sortState = 'asc';
                filteredData.sort((a, b) => d3.ascending(a[columnName], b[columnName]));
                break;
            case 'asc':
                sortState = 'desc';
                filteredData.sort((a, b) => d3.descending(a[columnName], b[columnName]));
                break;
            case 'desc':
                sortState = 'none';
                filteredData = [...originalData]; 
                break;
        }

        currentPage = 1;
        createTable();
        if (allowPagination) {
            createPagination();
        }
    }
    function createPagination() {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        const pagination = container.select(".pagination_container");
        pagination.selectAll("*").remove();

        function createPageButton(pageNumber) {
            pagination.append("span")
                .attr("class", "Pagination")
                .style("cursor", "pointer")
                .style("background-color", pageNumber === currentPage ? "#e0e0e0" : "#ffffff")
                .style("border", pageNumber === currentPage ? "1px solid #444" : "1px solid #ddd")
                .style("padding", "0.8vw")
                .style("margin", "2.4px")
                .style("color", "#444")
                .style("border-radius", "5px")
                .style("font-size", "2vmin")
                .style("font-weight", pageNumber === currentPage ? "bold" : "normal")
                .style("font-family", "Arial, sans-serif")
                .style("text-align", "center")
                .on("mouseover", function () {
                    d3.select(this).style("background-color", "#d0d0d0");
                })
                .on("mouseout", function () {
                    d3.select(this).style("background-color", pageNumber === currentPage ? "#e0e0e0" : "#f9f9f9");
                })
                .on("click", () => {
                    currentPage = pageNumber;
                    createTable();
                    createPagination();
                })
                .append("tspan")
                .text(pageNumber);
        }
        pagination.append("span")
            .attr("class", "Pagination")
            .style("cursor", currentPage > 1 ? "pointer" : "default")
            .style("border", "1px solid #ddd")
            .style("padding", "0.8vw")
            .style("background-color", "#f9f9f9")
            .style("margin", "2.4px")
            .style("border-radius", "5px")
            .style("font-size", "2vmin")
            .style("font-weight", "normal")
            .style("font-family", "Arial, sans-serif")
            .style("text-align", "center")
            .on("mouseover", function () {
                if (currentPage > 1) {
                    d3.select(this).style("background-color", "#d0d0d0");
                }
            })
            .on("mouseout", function () {
                d3.select(this).style("background-color", "#f9f9f9");
            })
            .on("click", () => {
                if (currentPage > 1) {
                    currentPage--;
                    createTable();
                    createPagination();
                }
            })
            .append("tspan")
            .text("Previous")
            .style("color", currentPage === 1 ? "rgba(0, 0, 0, 0.375)" : "#333");
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                createPageButton(i);
            }
        } else {
            createPageButton(1);
            const startPage = Math.max(2, currentPage - 1);
            const endPage = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage > 3) {
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

            if (currentPage < totalPages - 2) {
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
            .style("cursor", currentPage < totalPages ? "pointer" : "default")
            .style("background-color", "#f9f9f9")
            .style("border", "1px solid #ddd")
            .style("padding", "0.8vw")
            .style("margin", "2.4px")
            .style("border-radius", "5px")
            .style("font-size", "2vmin")
            .style("font-weight", "normal")
            .style("font-family", "Arial, sans-serif")
            .style("text-align", "center")
            .on("mouseover", function () {
                if (currentPage < totalPages) {
                    d3.select(this).style("background-color", "#d0d0d0");
                }
            })
            .on("mouseout", function () {
                d3.select(this).style("background-color", "#f9f9f9");
            })
            .on("click", () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    createTable();
                    createPagination();
                }
            })
            .append("span")
            .text("Next")
            .style("color", currentPage < totalPages ? "#333" : "rgba(0, 0, 0, 0.375)");
    }
  

    select.on("change", function () {
        rowsPerPage = this.value === String(data.length) ? data.length : +this.value; 
    
        if (rowsPerPage === data.length) {
            container.select(".scrollbar_container")
                .style("position", "relative")
                .style("height", "auto")
                .style("height", "570px")
                .style("overflow", "auto");
        } else if (rowsPerPage > 10) {
            container.select(".scrollbar_container")
                .style("position", "relative")
                .style("height", "570px")
                .style("overflow", "auto");
        } else {
            container.select(".scrollbar_container")
                .style("height", "auto")
                .style("overflow", "hidden");
        }
    
        if (allowPagination) {
            createPagination();
        }
        createTable();
    });

    if (allowPagination) {
        createPagination();
    }
    function handleResize() {
        createTable();
    }

    window.addEventListener("resize", handleResize);
    createTable();
}
const inputs = {
    selects: "#table",
    title: "Personal Information",
    data: [
        { "Name": "Bhuvnaneshwar Kumar", "Age": 21, "Place": "Chennai", "PhoneNumber": 8248995718, "Email-id": "bhuv@gmail.com" },
        { "Name": "Nishant Siraj", "Age": 24, "Place": "Bangalore", "PhoneNumber": 7845123699, "Email-id": "nishant@gmail.com" },
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
        { "Name": "Ayesha", "Age": 30, "Place": "Mumbai", "PhoneNumber": 7896541236, "Email-id": "ayesha@gmail.com" },
        { "Name": "Rahul", "Age": 28, "Place": "Delhi", "PhoneNumber": 9876541230, "Email-id": "rahul@gmail.com" }
    ],
    columns: [
        { name: "Name", sortable: true },
        { name: "Age", sortable: true },
        { name: "Place", sortable: true },
        { name: "PhoneNumber", sortable: false },
        { name: "Email-id", sortable: false }
        
    ],
    allowPagination: true,
    rowsPerPage: 20
};

table(inputs); 