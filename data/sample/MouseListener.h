#pragma once
#include "Misc.h"
class MouseListener
{
public:
	virtual void mousePressed(MEvent)=0;
	virtual void mouseReleased(MEvent)=0;
};

