if (!("console" in window)) {
  window.console = { log: function(s) {
                       var l = document.getElementById('log');
                       if (l) {
                         l.innerHTML = l.innerHTML + "<span>" + s.toString() + "</span><br>";
                       }
                     }
                   };
}


var gl = null;
var shaders = { };

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript)
        return null;

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3)
            str += k.textContent;
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderi(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function renderStart() {
  var name = (window.location.search.substring(1) || 'pyramid') + '.json';
  jQuery.getJSON(name, null, ajaxHandler);
}

function ajaxHandler(data) {
  var canvas = document.getElementById("canvas");

  var gl = null;
  try { 
    if (!gl)
        gl = canvas.getContext("moz-webgl");
  } catch (e) { }
  try { 
    if (!gl)
        gl = canvas.getContext("webkit-3d");
  } catch (e) { }


   
  if (!("sp" in shaders)) {
    shaders.fs = getShader(gl, "shader-fs");
    shaders.vs = getShader(gl, "shader-vs");

    shaders.sp = gl.createProgram();
    gl.attachShader(shaders.sp, shaders.vs);
    gl.attachShader(shaders.sp, shaders.fs);
    gl.linkProgram(shaders.sp);

    if (!gl.getProgrami(shaders.sp, gl.LINK_STATUS)) {
      alert(gl.getProgramInfoLog(shader));
    }

    gl.useProgram(shaders.sp);
  }

  var sp = shaders.sp;

  var va = gl.getAttribLocation(sp, "aVertex");
  var na = gl.getAttribLocation(sp, "aNormal");
  var ca = gl.getAttribLocation(sp, "aColor");

  var mvUniform = gl.getUniformLocation(sp, "uMVMatrix");
  var pmUniform = gl.getUniformLocation(sp, "uPMatrix");

    //var pmMatrix = makeOrtho(-15,15,-15,15, 0.01, 10000);

  function setMatrixUniforms() {
      gl.uniformMatrix4fv(mvUniform, false, new CanvasFloatArray(mvMatrix.flatten()));
      //gl.uniformMatrix4fv(pmUniform, false, new CanvasFloatArray(pmMatrix.flatten()));
      //gl.uniform3fv(viewPositionUniform, new CanvasFloatArray(vpos));
  }

  
  var models = [];
  for (name in data.models) {
    console.log(name);
    var model = {};

    model.verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new CanvasFloatArray(data.models[name].verts), gl.STATIC_DRAW);

    model.colorsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new CanvasFloatArray(data.models[name].colors), gl.STATIC_DRAW);

    model.length = data.models[name].verts.length / 3;

    models[name] = model;
  }
  
  //enable providing vertex positions by array
  gl.enableVertexAttribArray(va);
  //enable providing colors by array
  gl.enableVertexAttribArray(ca);


  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  m = makeLookAt(0, 0, -0.5, 0,0,0, 0,1,0);
  mvMult(m);
  mvScale([.5,.5,-.5]);

  var mx = 0;
  var lastX = 0;
  var my = 0;
  var lastY = 0;
  var thetaX = 0;
  var thetaY = 0;
  var mouseDown = false;

  function draw(t) {
    //theta = (2*t) % 360;
    pushMatrix();

    mvTranslate([0,0,1]);
    mvRotate(thetaX, [0, 1, 0]);
    mvRotate(thetaY, [1, 0, 0]);

    setMatrixUniforms();


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    customDraw();

    popMatrix();
  }

  function customDraw() {
    for (i = 0; i < data.ships.length; i++) {
      var ship = data.ships[i];
      var model = models[ship.model];

      pushMatrix();

      mvTranslate([ship.x, ship.y, ship.z]);
      if (ship.rotate) {
        mvRotate(ship.rotate[0]++, ship.rotate[1]);
      }
      setMatrixUniforms();

      gl.bindBuffer(gl.ARRAY_BUFFER, model.verticesBuffer);
      gl.vertexAttribPointer(va, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, model.colorsBuffer);
      gl.vertexAttribPointer(ca, 4, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, model.length);


      popMatrix();
    }
  }


  canvas.addEventListener("mouseup", function(ev) {
      mouseDown = false;
      

      return true;
        }, false);

  canvas.addEventListener("mousedown", function(ev) {
      mouseDown = true;
      lastX = ev.screenX;
      lastY = ev.screenY;
      return true;
        }, false);

  canvas.addEventListener("mousemove", function(ev) {
      if (mouseDown) {
      var mdelta = ev.screenX - lastX;
      lastX = ev.screenX;
      mx -= mdelta / 75;

      thetaX += mdelta;
      thetaX = thetaX % 360;

      mdelta = ev.screenY - lastY;
      lastY = ev.screenY;
      my -= mdelta / 75;

      thetaY -= mdelta;
      thetaY = thetaY % 360;
      }
                               

                            return true;
                          }, false)  
  var time = 0;
  setInterval(function() {

      draw(time++);  
      
      }, 10);
}

