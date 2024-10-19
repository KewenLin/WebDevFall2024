// 1 Looping a triangle

function loopTriangle(n){
    for(let i = 1; i <= n; i++){
        let triangles = "#"
        for(let j = 1; j < i; j++){
            triangles += "#"
        }
        console.log(triangles)
    }
}

loopTriangle(7)

// 2 FizzBuzz

function fizzBuzz(){
    for(let i = 1; i <= 100; i++){
        if (i % 3 == 0 && i % 5 == 0)
            console.log("FizzBuzz")
        else if(i % 3 == 0)
            console.log("Fizz")
        else if(i % 5 == 0)
            console.log("Buzz")
        else
            console.log(i)
    }
}

fizzBuzz()

// 3 Chessboard

function chessboard(width = 8, height = 8){
    let board = ""
    let space = true
    for(let y = 0; y < height; y++){
        for(let x = 0; x < width; x++){
            board += space ? " " : "#"
            space = space ? false : true
        }
        space = space ? false : true
        board += "\n"
    }
    console.log(board)
}

chessboard()