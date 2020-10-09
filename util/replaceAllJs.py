import re
import os
import sys

lineno=int(sys.argv[1])
targetFile=sys.argv[2]
sourceFile=sys.argv[3]
with open(sourceFile) as fileObj:
	content = fileObj.read()
	#print(content)

#coding=utf-8
lines=[]
f=open(targetFile,'r')  #your path!
for line in f:
    lines.append(line)
f.close()
#print lines
del lines[lineno]
lines.insert(lineno,content+"\n")
s=''.join(lines)
f=open(targetFile,'w+')
f.write(s)
f.close()
del lines[:]
#print lines
