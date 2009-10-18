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

  //var quadVerts = [
    //-0.5,  0.5, 0.0,
    //-0.5, -0.5, 0.0,
     //0.5,  0.5, 0.0, 
     //0.5, -0.5, 0.0
      //];


  //var triNormals = [
  //0.0, 0.0, -1.0,
  //0.0, 0.0, -1.0,
  //0.0, 0.0, -1.0,
  //0.0, 0.0, -1.0
  //];

  var triVerts = data.verts;
  var triColors = data.colors;

  var primType = gl.TRIANGLES;
  var numVerticies = triVerts.length / 3;

  // Create buffer names
  var quadBuffer = gl.createBuffer();

  var triBuffers = { };
  triBuffers.vertex = gl.createBuffer();
  //triBuffers.normal = gl.createBuffer();
  triBuffers.color = gl.createBuffer();

  // Bind a buffer object to triBuffer
  gl.bindBuffer(gl.ARRAY_BUFFER, triBuffers.vertex);

  // Put data into the currently bound (triBuffer) ARRAY_BUFFER
  gl.bufferData(gl.ARRAY_BUFFER, new CanvasFloatArray(triVerts), gl.STATIC_DRAW);

  gl.vertexAttribPointer(va, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(va);


  // Same for the normals
  //gl.bindBuffer(gl.ARRAY_BUFFER, triBuffers.normal);

  //gl.bufferData(gl.ARRAY_BUFFER, new CanvasFloatArray(triNormals), gl.STATIC_DRAW);

  //gl.vertexAttribPointer(na, 1, gl.FLOAT, false, 0, 0);
  //gl.enableVertexAttribArray(na);


  // Same for the colors
  gl.bindBuffer(gl.ARRAY_BUFFER, triBuffers.color);

  gl.bufferData(gl.ARRAY_BUFFER, new CanvasFloatArray(triColors), gl.STATIC_DRAW);

  gl.vertexAttribPointer(ca, 4, gl.FLOAT, false, 4, 0);
  gl.enableVertexAttribArray(ca);

  /*
  // Bind a buffer object to quadBuffer
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);

  // Put data into the currently bound (quadBuffer) ARRAY_BUFFER
  gl.bufferData(gl.ARRAY_BUFFER, new CanvasFloatArray(quadVerts), gl.STATIC_DRAW);
  */

  
  


  //gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  //gl.clearDepthf(1.0);
  //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

    m = makeLookAt(0, 0, -0.5, 0,0,0, 0,1,0);
    //m = makeOrtho(-1,1,-1,1, 0.00, 10000);
  //m = makeIdentity();
    mvMult(m);
  //mvRotate(90,[1,0,0]);
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
    gl.drawArrays(primType, 0, numVerticies);

    popMatrix();
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

