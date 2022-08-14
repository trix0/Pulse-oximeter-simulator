

import math


def floatToSFloat(val):
    dataBuf=[]
    exponent = 0xF
    result = 0x07FF
    sgn=0
    if(val>0):
        sgn=1
    else:
        sgn=-1

    mantissa = abs(val)


    if (math.isnan(val)):
        dataBuf = (result).to_bytes(2,"big")
        return dataBuf
    elif (val > 20450000000.0):
        result = 0x07FE
        dataBuf = (result).to_bytes(2,"big")
        return dataBuf
    elif (val < -20450000000.0):
        result = 0x0802
        dataBuf = (result).to_bytes(2,"big")
        return dataBuf
    elif (val >= -1e-8 and val <= 1e-8):
        result = 0
        dataBuf = (result).to_bytes(2,"big")
        return dataBuf

    while (mantissa > 0x07FD):
        mantissa /= 10.0
        exponent=exponent+1
        print("exponent is "+str(exponent))
        if (exponent > 7):
            if (sgn > 0):
                result = 0x07FE
            else:
                result = 0x0802
            dataBuf = (result).to_bytes(2,"big")
            break
        
    print("mantissa < 1 "+str(mantissa > 0x07FD))
    while (mantissa < 1):
        mantissa *= 10
        exponent=exponent-1
        print("exponent is "+str(exponent))
        if (exponent < -8):
            result = 0
            dataBuf = (result).to_bytes(2,"big")
            break
        
    

    smantissa = round(mantissa * 10000)
    rmantissa = round(mantissa) * 10000
    mdiff = abs(smantissa - rmantissa)

    while (mdiff > 0.5 and exponent > -8 and (mantissa * 10) <= 0x07FD):
        mantissa *= 10
        exponent=exponent+1
        print("exponent is "+str(exponent))
        smantissa = round(mantissa * 10000)
        rmantissa = round(mantissa) * 10000
        mdiff = abs(smantissa - rmantissa)
    int_mantissa = round(sgn * mantissa)
    result = ((exponent & 0xF) << 12) | (int_mantissa & 0xFFF)
    print("exponent:"+hex(exponent))
    print(hex(int_mantissa))
    print(hex(result))
    print("returning at the end")
    dataBuf = result.to_bytes(2,"big")
    return dataBuf





def main():
    x=510
    y=floatToSFloat(x)
    print(y.hex())
    print(type(y))

if __name__ == "__main__":
    main()
    
